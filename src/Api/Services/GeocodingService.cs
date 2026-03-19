using System.Text.Json;
using Api.Models.Dto;
using Microsoft.Extensions.Caching.Memory;

namespace Api.Services;

public class GeocodingService(IHttpClientFactory httpClientFactory, IMemoryCache cache, ILogger<GeocodingService> logger)
{
    private static readonly SemaphoreSlim RateLimiter = new(1, 1);
    private const string CachePrefix = "geocode:";

    public async Task<GeocodeResult?> GeocodeAsync(string address)
    {
        var cacheKey = CachePrefix + address.ToLowerInvariant().Trim();

        if (cache.TryGetValue(cacheKey, out GeocodeResult? cached))
            return cached;

        // Nominatim rate limit: 1 req/sec
        await RateLimiter.WaitAsync();
        try
        {
            var client = httpClientFactory.CreateClient("Nominatim");
            var query = $"?q={Uri.EscapeDataString(address + ", Toronto, Canada")}&format=json&limit=1";
            var response = await client.GetAsync(query);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var results = JsonSerializer.Deserialize<JsonElement[]>(json);

            if (results is null || results.Length == 0)
                return null;

            var first = results[0];
            var result = new GeocodeResult
            {
                Lat = double.Parse(first.GetProperty("lat").GetString()!),
                Lng = double.Parse(first.GetProperty("lon").GetString()!),
                DisplayName = first.GetProperty("display_name").GetString(),
            };

            cache.Set(cacheKey, result, TimeSpan.FromDays(30));
            return result;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Geocoding failed for address: {Address}", address);
            return null;
        }
        finally
        {
            // Ensure at least 1 second between requests
            _ = Task.Delay(1100).ContinueWith(_ => RateLimiter.Release());
        }
    }
}
