using System.Text.Json;
using Api.Data;
using Api.Models.Dto;
using Microsoft.EntityFrameworkCore;

namespace Api.Services;

public class PoolSearchService(AppDbContext db, PoolRankingService rankingService)
{
    // Default center: Toronto City Hall
    private const double DefaultLat = 43.6532;
    private const double DefaultLng = -79.3832;
    private const double DefaultRadiusKm = 10.0;

    public async Task<PoolSearchResponse> SearchAsync(PoolSearchRequest request)
    {
        var lat = request.Location?.Lat ?? DefaultLat;
        var lng = request.Location?.Lng ?? DefaultLng;
        var radiusKm = request.Location?.RadiusKm ?? DefaultRadiusKm;
        var weights = request.Ranking ?? new RankingWeights();

        // Load pools without PoolType filter in EF — we need both types for facet counts
        var query = db.Pools.Include(p => p.Schedules).Where(p => p.IsActive).AsQueryable();

        if (request.Attributes?.MinLength is > 0)
            query = query.Where(p => p.LengthMeters >= request.Attributes.MinLength);
        if (request.Attributes?.MinLanes is > 0)
            query = query.Where(p => p.LaneCount >= request.Attributes.MinLanes);

        var pools = await query.ToListAsync();

        // Build pool+distance list (filter by radius only)
        var poolsWithDistance = new List<(Models.Pool Pool, double Distance)>();
        foreach (var pool in pools)
        {
            var distance = GeoUtils.HaversineDistance(lat, lng, pool.Latitude, pool.Longitude);
            if (distance > radiusKm) continue;
            poolsWithDistance.Add((pool, distance));
        }

        // Compute facets if requested
        FacetCounts? facets = null;
        if (request.IncludeFacets)
            facets = ComputeFacets(poolsWithDistance, request);

        // Now apply all filters (including PoolType) for the actual results
        var results = new List<PoolSearchResult>();

        foreach (var (pool, distance) in poolsWithDistance)
        {
            // Apply PoolType filter in-memory ("Both" matches either Indoor or Outdoor)
            if (request.Attributes?.PoolType is not null
                && pool.PoolType != request.Attributes.PoolType
                && pool.PoolType != "Both")
                continue;

            // Apply amenity filter
            if (request.Attributes?.Amenities is { Length: > 0 } && !PoolHasAllAmenities(pool, request.Attributes.Amenities))
                continue;

            var scheduleList = FilterSchedules(pool.Schedules, request.SwimTypes, request.DaysOfWeek,
                request.TimeFrom, request.TimeTo, request.DateFrom, request.DateTo);

            // If swim type or day filters are set, only include pools with matching schedules
            if ((request.SwimTypes is { Length: > 0 } || request.DaysOfWeek is { Length: > 0 }) && scheduleList.Count == 0)
                continue;

            var scores = rankingService.CalculateScores(
                distance, radiusKm, pool.LengthMeters, pool.LaneCount, scheduleList.Count);
            var compositeScore = rankingService.CalculateCompositeScore(scores, weights);

            results.Add(new PoolSearchResult
            {
                PoolId = pool.Id,
                Name = pool.Name,
                Address = pool.Address,
                Latitude = pool.Latitude,
                Longitude = pool.Longitude,
                PoolType = pool.PoolType,
                LengthMeters = pool.LengthMeters,
                LaneCount = pool.LaneCount,
                IsAccessible = pool.IsAccessible,
                Phone = pool.Phone,
                Website = pool.Website,
                ImageUrl = pool.ImageUrl,
                Amenities = AmenityItem.DeserializeJson(pool.AmenitiesJson),
                DistanceKm = Math.Round(distance, 2),
                CompositeScore = Math.Round(compositeScore, 4),
                Scores = scores,
                MatchingSchedules = scheduleList.Select(s => new ScheduleResult
                {
                    ScheduleId = s.Id,
                    SwimType = s.SwimType,
                    DayOfWeek = s.DayOfWeek,
                    StartTime = s.StartTime.ToString("HH:mm"),
                    EndTime = s.EndTime.ToString("HH:mm"),
                }).ToList(),
            });
        }

        return new PoolSearchResponse
        {
            Results = results.OrderByDescending(r => r.CompositeScore).ToList(),
            Facets = facets,
        };
    }

    private static List<Models.Schedule> FilterSchedules(
        IEnumerable<Models.Schedule> schedules,
        string[]? swimTypes, int[]? daysOfWeek,
        TimeOnly? timeFrom, TimeOnly? timeTo,
        DateOnly? dateFrom, DateOnly? dateTo)
    {
        var filtered = schedules.AsEnumerable();

        if (swimTypes is { Length: > 0 })
            filtered = filtered.Where(s => swimTypes.Contains(s.SwimType));

        if (daysOfWeek is { Length: > 0 })
            filtered = filtered.Where(s => daysOfWeek.Contains(s.DayOfWeek));

        if (timeFrom.HasValue)
            filtered = filtered.Where(s => s.StartTime >= timeFrom.Value || s.EndTime >= timeFrom.Value);

        if (timeTo.HasValue)
            filtered = filtered.Where(s => s.StartTime <= timeTo.Value);

        if (dateFrom.HasValue)
            filtered = filtered.Where(s => s.EffectiveTo == null || s.EffectiveTo >= dateFrom.Value);

        if (dateTo.HasValue)
            filtered = filtered.Where(s => s.EffectiveFrom <= dateTo.Value);

        return filtered.ToList();
    }

    private static FacetCounts ComputeFacets(
        List<(Models.Pool Pool, double Distance)> poolsWithDistance,
        PoolSearchRequest request)
    {
        var facets = new FacetCounts();

        // Collect all distinct swim types across all pools
        var allSwimTypes = poolsWithDistance
            .SelectMany(p => p.Pool.Schedules.Select(s => s.SwimType))
            .Distinct();

        // Swim type facets: count pools matching all filters EXCEPT swimTypes
        foreach (var swimType in allSwimTypes)
        {
            var count = 0;
            foreach (var (pool, _) in poolsWithDistance)
            {
                if (request.Attributes?.PoolType is not null
                    && pool.PoolType != request.Attributes.PoolType
                    && pool.PoolType != "Both")
                    continue;

                if (request.Attributes?.Amenities is { Length: > 0 } && !PoolHasAllAmenities(pool, request.Attributes.Amenities))
                    continue;

                // Apply all schedule filters except swimTypes, then check if this swimType exists
                var schedules = FilterSchedules(pool.Schedules, null, request.DaysOfWeek,
                    request.TimeFrom, request.TimeTo, request.DateFrom, request.DateTo);

                if (schedules.Any(s => s.SwimType == swimType))
                    count++;
            }
            facets.SwimTypes[swimType] = count;
        }

        // Day facets: count pools matching all filters EXCEPT daysOfWeek
        for (var day = 0; day < 7; day++)
        {
            var count = 0;
            foreach (var (pool, _) in poolsWithDistance)
            {
                if (request.Attributes?.PoolType is not null
                    && pool.PoolType != request.Attributes.PoolType
                    && pool.PoolType != "Both")
                    continue;

                if (request.Attributes?.Amenities is { Length: > 0 } && !PoolHasAllAmenities(pool, request.Attributes.Amenities))
                    continue;

                var schedules = FilterSchedules(pool.Schedules, request.SwimTypes, null,
                    request.TimeFrom, request.TimeTo, request.DateFrom, request.DateTo);

                if (schedules.Any(s => s.DayOfWeek == day))
                    count++;
            }
            facets.DaysOfWeek[day] = count;
        }

        // Pool type facets: count pools matching all filters EXCEPT poolType
        // "Both" pools count toward both Indoor and Outdoor facets
        foreach (var poolType in new[] { "Indoor", "Outdoor" })
        {
            var count = 0;
            foreach (var (pool, _) in poolsWithDistance)
            {
                if (pool.PoolType != poolType && pool.PoolType != "Both")
                    continue;

                if (request.Attributes?.Amenities is { Length: > 0 } && !PoolHasAllAmenities(pool, request.Attributes.Amenities))
                    continue;

                var schedules = FilterSchedules(pool.Schedules, request.SwimTypes, request.DaysOfWeek,
                    request.TimeFrom, request.TimeTo, request.DateFrom, request.DateTo);

                // Pool must have matching schedules if schedule filters are active
                if ((request.SwimTypes is { Length: > 0 } || request.DaysOfWeek is { Length: > 0 }) && schedules.Count == 0)
                    continue;

                count++;
            }
            facets.PoolTypes[poolType] = count;
        }

        // Amenity facets: count pools that have each amenity, respecting all filters EXCEPT amenities
        var allAmenities = poolsWithDistance
            .Where(p => p.Pool.AmenitiesJson != null)
            .SelectMany(p => AmenityItem.DeserializeNames(p.Pool.AmenitiesJson))
            .Distinct();

        foreach (var amenity in allAmenities)
        {
            var count = 0;
            foreach (var (pool, _) in poolsWithDistance)
            {
                if (request.Attributes?.PoolType is not null
                    && pool.PoolType != request.Attributes.PoolType
                    && pool.PoolType != "Both")
                    continue;

                if (!PoolHasAmenity(pool, amenity))
                    continue;

                var schedules = FilterSchedules(pool.Schedules, request.SwimTypes, request.DaysOfWeek,
                    request.TimeFrom, request.TimeTo, request.DateFrom, request.DateTo);

                if ((request.SwimTypes is { Length: > 0 } || request.DaysOfWeek is { Length: > 0 }) && schedules.Count == 0)
                    continue;

                count++;
            }
            facets.Amenities[amenity] = count;
        }

        return facets;
    }

    private static bool PoolHasAllAmenities(Models.Pool pool, string[] requiredAmenities)
    {
        var names = AmenityItem.DeserializeNames(pool.AmenitiesJson);
        if (names.Length == 0) return false;
        return requiredAmenities.All(a => names.Contains(a, StringComparer.OrdinalIgnoreCase));
    }

    private static bool PoolHasAmenity(Models.Pool pool, string amenity)
    {
        var names = AmenityItem.DeserializeNames(pool.AmenitiesJson);
        return names.Any(n => string.Equals(n, amenity, StringComparison.OrdinalIgnoreCase));
    }
}
