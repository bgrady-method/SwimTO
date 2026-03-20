using System.Text.Json;
using System.Text.RegularExpressions;
using Api.Data;
using Api.Models.Dto;
using Microsoft.EntityFrameworkCore;

namespace Api.Services.DataSync;

public class PoolEnrichmentService(
    AppDbContext db,
    IHttpClientFactory httpClientFactory,
    ILogger<PoolEnrichmentService> logger)
{
    private const string BaseUrl = "https://www.toronto.ca/data/parks/live/locations/";
    private const string LocationPageBase = "https://www.toronto.ca/data/parks/prd/facilities/complex/";
    private const int DelayMs = 500;

    private const string ArcGisUrl = "https://services3.arcgis.com/b9WvedVPoizGfvfD/arcgis/rest/services/V_Swim_Locations_2022/FeatureServer/0/query?where=1=1&outFields=locationid,amenities,activity_type&f=json&resultRecordCount=500";

    public async Task EnrichAllAsync(CancellationToken ct = default)
    {
        // Fetch amenities from ArcGIS first (single API call)
        await FetchAmenitiesAsync(ct);

        var pools = await db.Pools
            .Where(p => p.IsActive && p.TorontoLocationId.HasValue)
            .ToListAsync(ct);

        logger.LogInformation("Enriching {Count} pools from Toronto location API...", pools.Count);

        var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Add("User-Agent", "SwimTO/1.0 (toronto-pool-finder)");
        client.Timeout = TimeSpan.FromSeconds(15);

        var enriched = 0;

        foreach (var pool in pools)
        {
            var locId = pool.TorontoLocationId!.Value;

            try
            {
                // Fetch images
                if (pool.ImageUrl is null)
                {
                    var imageUrl = await FetchMainImageUrlAsync(client, locId, ct);
                    if (imageUrl is not null)
                    {
                        pool.ImageUrl = imageUrl;
                        enriched++;
                    }
                }

                await Task.Delay(DelayMs, ct);

                // Fetch description for dimensions
                if (pool.LengthMeters is null || pool.LaneCount is null)
                {
                    var (lengthMeters, laneCount) = await FetchDimensionsAsync(client, locId, ct);
                    if (pool.LengthMeters is null && lengthMeters is not null)
                        pool.LengthMeters = lengthMeters;
                    if (pool.LaneCount is null && laneCount is not null)
                        pool.LaneCount = laneCount;
                }

                await Task.Delay(DelayMs, ct);

                // Fix missing website
                if (pool.Website is null)
                {
                    var website = await TryResolveWebsiteAsync(client, locId, ct);
                    if (website is not null)
                        pool.Website = website;
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "Failed to enrich pool {Name} (Location {Id})", pool.Name, locId);
            }
        }

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Enrichment complete: {Enriched} pools updated with images/dimensions", enriched);
    }

    private static readonly HashSet<string> PoolRelevantAccessibility = new(StringComparer.OrdinalIgnoreCase)
    {
        "Mobile Water Chair", "Ramp into pool", "Chair-lift into pool",
        "Chair-life into pool", "Warm pool", "Barrier free shower",
    };

    private async Task FetchAmenitiesAsync(CancellationToken ct)
    {
        try
        {
            var client = httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("User-Agent", "SwimTO/1.0 (toronto-pool-finder)");
            client.Timeout = TimeSpan.FromSeconds(30);

            var response = await client.GetAsync(ArcGisUrl, ct);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("ArcGIS amenities request failed with {StatusCode}", response.StatusCode);
                return;
            }

            var json = await response.Content.ReadAsStringAsync(ct);
            var doc = JsonSerializer.Deserialize<JsonElement>(json);

            if (!doc.TryGetProperty("features", out var features))
            {
                logger.LogWarning("ArcGIS response missing 'features' property");
                return;
            }

            // Build lookup: locationid → amenity list
            var amenityMap = new Dictionary<int, string[]>();
            foreach (var feature in features.EnumerateArray())
            {
                if (!feature.TryGetProperty("attributes", out var attrs)) continue;
                if (!attrs.TryGetProperty("locationid", out var locIdProp)) continue;

                var locId = locIdProp.ValueKind == JsonValueKind.Number ? locIdProp.GetInt32() : 0;
                if (locId == 0) continue;

                if (attrs.TryGetProperty("amenities", out var amenProp) && amenProp.ValueKind == JsonValueKind.String)
                {
                    var amenStr = amenProp.GetString();
                    if (!string.IsNullOrWhiteSpace(amenStr))
                    {
                        var amenities = amenStr.Split(", ", StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                        if (amenities.Length > 0)
                            amenityMap[locId] = amenities;
                    }
                }
            }

            // Update pools — always re-validate amenities (not just null ones)
            var pools = await db.Pools
                .Where(p => p.IsActive && p.TorontoLocationId.HasValue)
                .ToListAsync(ct);

            var updated = 0;
            foreach (var pool in pools)
            {
                var locId = pool.TorontoLocationId!.Value;
                var arcgisItems = amenityMap.TryGetValue(locId, out var items) ? items : [];

                // Fetch accessibility.json from toronto.ca for validation
                var accessItems = await FetchAccessibilityItemsAsync(client, locId, ct);
                await Task.Delay(DelayMs, ct);

                var result = CrossReferenceAmenities(arcgisItems, accessItems);

                // Don't overwrite null with empty array — null means "no data"
                if (result.Length == 0 && pool.AmenitiesJson is null)
                    continue;

                var newJson = result.Length > 0 ? JsonSerializer.Serialize(result) : null;
                if (pool.AmenitiesJson != newJson)
                {
                    pool.AmenitiesJson = newJson;
                    updated++;
                }
            }

            await db.SaveChangesAsync(ct);
            logger.LogInformation("Amenity enrichment: {Updated}/{Total} pools updated with verified amenities from {Source} ArcGIS records",
                updated, pools.Count, amenityMap.Count);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Failed to fetch amenities from ArcGIS");
        }
    }

    private async Task<string[]> FetchAccessibilityItemsAsync(HttpClient client, int locationId, CancellationToken ct)
    {
        try
        {
            var url = $"{BaseUrl}{locationId}/accessibility.json";
            var response = await client.GetAsync(url, ct);
            if (!response.IsSuccessStatusCode) return [];

            var json = await response.Content.ReadAsStringAsync(ct);
            var doc = JsonSerializer.Deserialize<JsonElement>(json);

            var titles = new List<string>();
            // accessibility.json returns an array of objects with a "title" field
            if (doc.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in doc.EnumerateArray())
                {
                    if (item.TryGetProperty("title", out var titleProp) && titleProp.ValueKind == JsonValueKind.String)
                    {
                        var title = titleProp.GetString();
                        if (!string.IsNullOrWhiteSpace(title))
                            titles.Add(title);
                    }
                }
            }
            else if (doc.ValueKind == JsonValueKind.Object)
            {
                // Some responses may be wrapped in an object with an array property
                foreach (var prop in doc.EnumerateObject())
                {
                    if (prop.Value.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var item in prop.Value.EnumerateArray())
                        {
                            if (item.TryGetProperty("title", out var titleProp) && titleProp.ValueKind == JsonValueKind.String)
                            {
                                var title = titleProp.GetString();
                                if (!string.IsNullOrWhiteSpace(title))
                                    titles.Add(title);
                            }
                        }
                    }
                }
            }

            return titles.ToArray();
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogDebug(ex, "Could not fetch accessibility.json for location {Id}", locationId);
            return [];
        }
    }

    private static AmenityItem[] CrossReferenceAmenities(string[] arcgisItems, string[] accessItems)
    {
        var result = new List<AmenityItem>();
        var matchedAccessItems = new HashSet<int>();

        foreach (var item in arcgisItems)
        {
            var verified = false;
            for (int i = 0; i < accessItems.Length; i++)
            {
                if (FuzzyMatch(item, accessItems[i]))
                {
                    verified = true;
                    matchedAccessItems.Add(i);
                    break;
                }
            }
            result.Add(new AmenityItem { Name = item, Verified = verified });
        }

        // Add pool-relevant accessibility items not already matched
        for (int i = 0; i < accessItems.Length; i++)
        {
            if (matchedAccessItems.Contains(i)) continue;
            if (!IsPoolRelevantAccessibility(accessItems[i])) continue;
            result.Add(new AmenityItem { Name = accessItems[i], Verified = true });
        }

        return result.ToArray();
    }

    private static bool FuzzyMatch(string arcgisItem, string accessItem)
    {
        var a = arcgisItem.Trim().ToLowerInvariant();
        var b = accessItem.Trim().ToLowerInvariant();

        if (a == b) return true;
        if (a.StartsWith(b) || b.StartsWith(a)) return true;

        // Handle known typos: "Chair-life" vs "Chair-lift"
        var aNorm = a.Replace("chair-life", "chair-lift");
        var bNorm = b.Replace("chair-life", "chair-lift");
        if (aNorm == bNorm) return true;
        if (aNorm.StartsWith(bNorm) || bNorm.StartsWith(aNorm)) return true;

        return false;
    }

    private static bool IsPoolRelevantAccessibility(string title)
    {
        var trimmed = title.Trim();
        return PoolRelevantAccessibility.Any(relevant =>
            trimmed.StartsWith(relevant, StringComparison.OrdinalIgnoreCase));
    }

    private async Task<string?> FetchMainImageUrlAsync(HttpClient client, int locationId, CancellationToken ct)
    {
        try
        {
            var url = $"{BaseUrl}{locationId}/images.json";
            var response = await client.GetAsync(url, ct);
            if (!response.IsSuccessStatusCode) return null;

            var json = await response.Content.ReadAsStringAsync(ct);
            var wrapper = JsonSerializer.Deserialize<ImagesResponse>(json, JsonOptions);
            var images = wrapper?.Assets;
            if (images is null || images.Count == 0) return null;

            // Priority: main image, then one with "pool" in name/alt, then first
            var mainImage = images.FirstOrDefault(i =>
                string.Equals(i.Main, "Y", StringComparison.OrdinalIgnoreCase));

            mainImage ??= images.FirstOrDefault(i =>
                (i.Fname?.Contains("pool", StringComparison.OrdinalIgnoreCase) ?? false) ||
                (i.Alt?.Contains("pool", StringComparison.OrdinalIgnoreCase) ?? false));

            mainImage ??= images[0];

            // Use the direct URL if available, otherwise construct it
            if (mainImage.Url is not null)
                return mainImage.Url;

            if (mainImage.Fname is null) return null;
            return $"https://www.toronto.ca/ext/pfr/img/{locationId}/{mainImage.Fname}";
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogDebug(ex, "Could not fetch images for location {Id}", locationId);
            return null;
        }
    }

    private async Task<(double? LengthMeters, int? LaneCount)> FetchDimensionsAsync(
        HttpClient client, int locationId, CancellationToken ct)
    {
        try
        {
            var url = $"{BaseUrl}{locationId}/description.json";
            var response = await client.GetAsync(url, ct);
            if (!response.IsSuccessStatusCode) return (null, null);

            var json = await response.Content.ReadAsStringAsync(ct);
            var desc = JsonSerializer.Deserialize<DescriptionEntry>(json, JsonOptions);
            var text = desc?.Desc;
            if (string.IsNullOrWhiteSpace(text)) return (null, null);

            // Strip HTML tags for cleaner regex matching
            text = Regex.Replace(text, "<[^>]+>", " ");

            double? lengthMeters = null;
            int? laneCount = null;

            // Match meters: "25 metres", "25 meters", "25m", "25 m"
            var meterMatch = Regex.Match(text, @"(\d+)\s*(?:metres?|meters?|m)\b", RegexOptions.IgnoreCase);
            if (meterMatch.Success && double.TryParse(meterMatch.Groups[1].Value, out var meters))
            {
                if (meters is >= 10 and <= 100) // reasonable pool length
                    lengthMeters = meters;
            }

            // Match yards: "25 yards"
            if (lengthMeters is null)
            {
                var yardMatch = Regex.Match(text, @"(\d+)\s*yards?\b", RegexOptions.IgnoreCase);
                if (yardMatch.Success && double.TryParse(yardMatch.Groups[1].Value, out var yards))
                {
                    var converted = Math.Round(yards * 0.9144, 1);
                    if (converted is >= 10 and <= 100)
                        lengthMeters = converted;
                }
            }

            // Match lanes: "6 lanes", "6-lane"
            var laneMatch = Regex.Match(text, @"(\d+)\s*-?\s*lanes?\b", RegexOptions.IgnoreCase);
            if (laneMatch.Success && int.TryParse(laneMatch.Groups[1].Value, out var lanes))
            {
                if (lanes is >= 1 and <= 20)
                    laneCount = lanes;
            }

            return (lengthMeters, laneCount);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogDebug(ex, "Could not fetch description for location {Id}", locationId);
            return (null, null);
        }
    }

    private async Task<string?> TryResolveWebsiteAsync(HttpClient client, int locationId, CancellationToken ct)
    {
        try
        {
            var url = $"{LocationPageBase}?id={locationId}";
            var request = new HttpRequestMessage(HttpMethod.Head, url);
            var response = await client.SendAsync(request, ct);
            return response.IsSuccessStatusCode ? url : null;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogDebug(ex, "Could not resolve website for location {Id}", locationId);
            return null;
        }
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private class ImagesResponse
    {
        public List<ImageEntry>? Assets { get; set; }
    }

    private class ImageEntry
    {
        public string? Fname { get; set; }
        public string? Alt { get; set; }
        public string? Main { get; set; }
        public string? Url { get; set; }
    }

    private class DescriptionEntry
    {
        public string? Desc { get; set; }
    }
}
