using System.Text.Json;
using System.Text.RegularExpressions;
using Api.Data;
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

    public async Task EnrichAllAsync(CancellationToken ct = default)
    {
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
