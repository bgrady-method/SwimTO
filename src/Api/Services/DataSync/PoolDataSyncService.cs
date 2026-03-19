using System.Globalization;
using System.Text.Json;
using Api.Data;
using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Services.DataSync;

public class PoolDataSyncService(
    AppDbContext db,
    TorontoOpenDataClient client,
    GeocodingService geocodingService,
    ILogger<PoolDataSyncService> logger)
{
    private static readonly Dictionary<string, int> DayNameToNumber = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Sunday"] = 0, ["Monday"] = 1, ["Tuesday"] = 2, ["Wednesday"] = 3,
        ["Thursday"] = 4, ["Friday"] = 5, ["Saturday"] = 6,
    };

    public async Task<DataSyncLog> RunFullSyncAsync(CancellationToken ct = default)
    {
        var syncLog = new DataSyncLog
        {
            SyncType = "Full",
            StartedAt = DateTime.UtcNow,
            Status = "Running",
        };
        db.DataSyncLogs.Add(syncLog);
        await db.SaveChangesAsync(ct);

        try
        {
            // 1. Fetch facilities (Indoor Pool + Outdoor Pool)
            logger.LogInformation("Fetching indoor pool facilities...");
            var indoorRecords = await client.CkanQueryAllAsync(
                TorontoOpenDataClient.Resources.Facilities,
                new() { ["Facility Type (Display Name)"] = "Indoor Pool" }, ct);

            logger.LogInformation("Fetching outdoor pool facilities...");
            var outdoorRecords = await client.CkanQueryAllAsync(
                TorontoOpenDataClient.Resources.Facilities,
                new() { ["Facility Type (Display Name)"] = "Outdoor Pool" }, ct);

            var allFacilities = indoorRecords.Concat(outdoorRecords).ToList();
            logger.LogInformation("Got {Count} total facility tank records", allFacilities.Count);

            // Group by Location ID to build pool summaries
            var locationFacilities = new Dictionary<int, (string PoolType, int TankCount, string AssetName)>();
            foreach (var rec in allFacilities)
            {
                var locId = rec.GetInt("Location ID");
                if (locId is null) continue;

                var facilityType = rec.GetString("Facility Type (Display Name)");
                var isIndoor = facilityType == "Indoor Pool";
                var assetName = rec.GetString("Asset Name");

                if (locationFacilities.TryGetValue(locId.Value, out var existing))
                {
                    var newType = existing.PoolType == "Indoor" && !isIndoor ? "Both"
                        : existing.PoolType == "Outdoor" && isIndoor ? "Both"
                        : existing.PoolType;
                    locationFacilities[locId.Value] = (newType, existing.TankCount + 1, existing.AssetName);
                }
                else
                {
                    locationFacilities[locId.Value] = (isIndoor ? "Indoor" : "Outdoor", 1, assetName);
                }
            }

            var locationIds = locationFacilities.Keys.ToList();
            logger.LogInformation("{Count} unique pool locations found", locationIds.Count);

            // 2. Fetch location details
            logger.LogInformation("Fetching location details...");
            var allLocations = await client.CkanQueryAllAsync(
                TorontoOpenDataClient.Resources.Locations, ct: ct);
            var locationMap = new Dictionary<int, LocationInfo>();
            var idSet = new HashSet<int>(locationIds);

            foreach (var rec in allLocations)
            {
                var locId = rec.GetInt("Location ID");
                if (locId is null || !idSet.Contains(locId.Value)) continue;

                var streetNo = rec.GetString("Street No");
                var streetName = rec.GetString("Street Name");
                var streetType = rec.GetString("Street Type");
                var streetDir = rec.GetString("Street Direction");
                var address = BuildAddress(streetNo, streetName, streetType, streetDir);

                locationMap[locId.Value] = new LocationInfo(
                    Name: rec.GetString("Location Name"),
                    Address: string.IsNullOrWhiteSpace(address) ? "UNKNOWN" : address,
                    Accessibility: rec.GetString("Accessibility"),
                    Description: rec.GetString("Description")
                );
            }

            logger.LogInformation("Matched {Count} of {Total} location IDs", locationMap.Count, locationIds.Count);

            // 3. Fetch GeoJSON data (coordinates, phone, website)
            logger.LogInformation("Fetching GeoJSON data...");
            var allGeo = await client.CkanQueryAllAsync(
                TorontoOpenDataClient.Resources.ParksGeoJson, ct: ct);
            var geoMap = new Dictionary<int, GeoInfo>();

            foreach (var rec in allGeo)
            {
                var locId = rec.GetInt("LOCATIONID");
                if (locId is null || !idSet.Contains(locId.Value)) continue;

                double? lat = null, lng = null;
                if (rec.TryGetValue("geometry", out var geoEl) && geoEl.ValueKind == JsonValueKind.Object)
                {
                    if (geoEl.TryGetProperty("coordinates", out var coords) && coords.ValueKind == JsonValueKind.Array)
                    {
                        var arr = coords.EnumerateArray().ToList();
                        if (arr.Count >= 2)
                        {
                            lng = arr[0].GetDouble();
                            lat = arr[1].GetDouble();
                        }
                    }
                }

                geoMap[locId.Value] = new GeoInfo(
                    Latitude: lat,
                    Longitude: lng,
                    Address: rec.GetString("ADDRESS"),
                    Phone: rec.GetString("PHONE"),
                    Url: rec.GetString("URL")
                );
            }

            logger.LogInformation("Matched {Count} geo records for pool locations", geoMap.Count);

            // 4. Fetch drop-in schedules
            logger.LogInformation("Fetching drop-in swim schedules...");
            var scheduleRecords = await client.CkanQueryAllAsync(
                TorontoOpenDataClient.Resources.DropInSchedules,
                new() { ["Section"] = "Swim - Drop-In" }, ct);

            logger.LogInformation("Got {Count} swim drop-in schedule records", scheduleRecords.Count);

            var schedulesByLocation = new Dictionary<int, List<ScheduleInfo>>();
            foreach (var rec in scheduleRecords)
            {
                var locId = rec.GetInt("Location ID", "LocationID");
                if (locId is null || !idSet.Contains(locId.Value)) continue;

                var dayStr = rec.GetString("DayOftheWeek", "Day of the Week");
                if (!DayNameToNumber.TryGetValue(dayStr, out var dayNum)) continue;

                var startHour = rec.GetInt("Start Hour", "StartHour") ?? 0;
                var startMin = rec.GetInt("Start Minute", "Start Min") ?? 0;
                var endHour = rec.GetInt("End Hour", "EndHour") ?? 0;
                var endMin = rec.GetInt("End Min", "End Minute") ?? 0;

                var firstDateStr = rec.GetString("First Date", "FirstDate");
                var lastDateStr = rec.GetString("Last Date", "LastDate");

                DateOnly? effectiveFrom = null;
                DateOnly? effectiveTo = null;

                if (TryParseDate(firstDateStr, out var from)) effectiveFrom = from;
                if (TryParseDate(lastDateStr, out var to)) effectiveTo = to;

                if (!schedulesByLocation.ContainsKey(locId.Value))
                    schedulesByLocation[locId.Value] = [];

                schedulesByLocation[locId.Value].Add(new ScheduleInfo(
                    CourseTitle: rec.GetString("Course Title", "Course_Title"),
                    DayOfWeek: dayNum,
                    StartTime: new TimeOnly(Math.Clamp(startHour, 0, 23), Math.Clamp(startMin, 0, 59)),
                    EndTime: new TimeOnly(Math.Clamp(endHour, 0, 23), Math.Clamp(endMin, 0, 59)),
                    EffectiveFrom: effectiveFrom ?? DateOnly.FromDateTime(DateTime.Today),
                    EffectiveTo: effectiveTo
                ));
            }

            logger.LogInformation("Schedules for {Count} locations", schedulesByLocation.Count);

            // 5. Upsert within a transaction
            await using var transaction = await db.Database.BeginTransactionAsync(ct);

            var existingPools = await db.Pools.Include(p => p.Schedules).ToListAsync(ct);
            var existingByLocationId = existingPools
                .Where(p => p.TorontoLocationId.HasValue)
                .ToDictionary(p => p.TorontoLocationId!.Value);

            var poolsAdded = 0;
            var poolsUpdated = 0;
            var schedulesReplaced = 0;
            var seenLocationIds = new HashSet<int>();

            foreach (var locId in locationIds)
            {
                seenLocationIds.Add(locId);
                var facility = locationFacilities[locId];
                locationMap.TryGetValue(locId, out var location);
                geoMap.TryGetValue(locId, out var geo);

                var name = location?.Name ?? facility.AssetName;
                if (string.IsNullOrWhiteSpace(name)) name = facility.AssetName;

                var address = location?.Address ?? geo?.Address ?? "UNKNOWN";
                var lat = geo?.Latitude;
                var lng = geo?.Longitude;
                var phone = !string.IsNullOrWhiteSpace(geo?.Phone) ? geo.Phone : null;
                var website = !string.IsNullOrWhiteSpace(geo?.Url) ? geo.Url : null;
                var isAccessible = location?.Accessibility is "Fully Accessible" or "Partially Accessible";

                // Geocode fallback for missing coordinates
                if (lat is null or 0 || lng is null or 0)
                {
                    if (address != "UNKNOWN")
                    {
                        var geocoded = await geocodingService.GeocodeAsync(address);
                        if (geocoded is not null)
                        {
                            lat = geocoded.Lat;
                            lng = geocoded.Lng;
                        }
                    }
                }

                // Use "Indoor" for "Both" since the Pool model only supports Indoor/Outdoor
                var poolType = facility.PoolType == "Both" ? "Indoor" : facility.PoolType;

                if (existingByLocationId.TryGetValue(locId, out var existingPool))
                {
                    // Update existing pool
                    existingPool.Name = name;
                    existingPool.Address = address;
                    if (lat is not null and not 0) existingPool.Latitude = lat.Value;
                    if (lng is not null and not 0) existingPool.Longitude = lng.Value;
                    existingPool.PoolType = poolType;
                    existingPool.IsAccessible = isAccessible;
                    existingPool.Phone = phone;
                    existingPool.Website = website;
                    existingPool.IsActive = true;

                    // Replace schedules
                    db.Schedules.RemoveRange(existingPool.Schedules);
                    existingPool.Schedules.Clear();
                    poolsUpdated++;
                }
                else
                {
                    // Insert new pool
                    existingPool = new Pool
                    {
                        Name = name,
                        Address = address,
                        Latitude = lat ?? 0,
                        Longitude = lng ?? 0,
                        PoolType = poolType,
                        IsAccessible = isAccessible,
                        Phone = phone,
                        Website = website,
                        TorontoLocationId = locId,
                        IsActive = true,
                    };
                    db.Pools.Add(existingPool);
                    poolsAdded++;
                }

                // Add schedules
                if (schedulesByLocation.TryGetValue(locId, out var schedules))
                {
                    foreach (var sched in schedules)
                    {
                        existingPool.Schedules.Add(new Schedule
                        {
                            SwimType = sched.CourseTitle,
                            DayOfWeek = sched.DayOfWeek,
                            StartTime = sched.StartTime,
                            EndTime = sched.EndTime,
                            EffectiveFrom = sched.EffectiveFrom,
                            EffectiveTo = sched.EffectiveTo,
                        });
                        schedulesReplaced++;
                    }
                }
            }

            // Soft-delete pools whose TorontoLocationId no longer appears
            foreach (var pool in existingPools.Where(p => p.TorontoLocationId.HasValue))
            {
                if (!seenLocationIds.Contains(pool.TorontoLocationId!.Value))
                {
                    pool.IsActive = false;
                }
            }

            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            // Update sync log
            syncLog.Status = "Success";
            syncLog.CompletedAt = DateTime.UtcNow;
            syncLog.PoolsAdded = poolsAdded;
            syncLog.PoolsUpdated = poolsUpdated;
            syncLog.SchedulesReplaced = schedulesReplaced;
            await db.SaveChangesAsync(ct);

            logger.LogInformation(
                "Sync complete: {Added} added, {Updated} updated, {Schedules} schedules",
                poolsAdded, poolsUpdated, schedulesReplaced);

            return syncLog;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Data sync failed");
            syncLog.Status = "Failed";
            syncLog.CompletedAt = DateTime.UtcNow;
            syncLog.ErrorMessage = ex.Message;
            await db.SaveChangesAsync(CancellationToken.None);
            throw;
        }
    }

    private static string BuildAddress(string streetNo, string streetName, string streetType, string streetDir)
    {
        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(streetNo)) parts.Add(streetNo);
        if (!string.IsNullOrWhiteSpace(streetName)) parts.Add(streetName);
        if (!string.IsNullOrWhiteSpace(streetType)) parts.Add(streetType);
        if (!string.IsNullOrWhiteSpace(streetDir)) parts.Add(streetDir);
        return string.Join(" ", parts);
    }

    private static bool TryParseDate(string? dateStr, out DateOnly result)
    {
        result = default;
        if (string.IsNullOrWhiteSpace(dateStr)) return false;

        // Toronto API returns dates like "2025-01-06T00:00:00" or "2025-01-06"
        if (DateTime.TryParse(dateStr, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
        {
            result = DateOnly.FromDateTime(dt);
            return true;
        }
        return false;
    }

    private record LocationInfo(string Name, string Address, string Accessibility, string Description);
    private record GeoInfo(double? Latitude, double? Longitude, string Address, string Phone, string Url);
    private record ScheduleInfo(string CourseTitle, int DayOfWeek, TimeOnly StartTime, TimeOnly EndTime, DateOnly EffectiveFrom, DateOnly? EffectiveTo);
}
