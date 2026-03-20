using System.Text.Json;

namespace Api.Services.DataSync;

public class TorontoOpenDataClient(IHttpClientFactory httpClientFactory, ILogger<TorontoOpenDataClient> logger)
{
    private static readonly SemaphoreSlim RateLimiter = new(1, 1);
    private const int MaxRetries = 3;
    private const int PageSize = 100;

    // CKAN Resource IDs (validated by audit tool)
    public static class Resources
    {
        public const string Facilities = "e16505dc-f106-4b58-a689-ed0a2b8b0b69";
        public const string Locations = "f23ac1ad-6f46-4b59-811f-eb34be9b1f7a";
        public const string ParksGeoJson = "e8cd0f4d-4910-42a0-81f9-cf8c2218753a";
        public const string DropInSchedules = "c99ec04f-4540-482c-9ee4-efb38774eab4";
    }

    public async Task<List<Dictionary<string, JsonElement>>> CkanQueryAllAsync(
        string resourceId,
        Dictionary<string, string>? filters = null,
        CancellationToken ct = default)
    {
        var allRecords = new List<Dictionary<string, JsonElement>>();
        var offset = 0;

        while (true)
        {
            ct.ThrowIfCancellationRequested();
            var response = await CkanQueryAsync(resourceId, filters, PageSize, offset, ct);
            var records = response.Records;
            if (records.Count == 0) break;
            allRecords.AddRange(records);
            offset += PageSize;
            if (allRecords.Count >= response.Total) break;
        }

        return allRecords;
    }

    private async Task<CkanResult> CkanQueryAsync(
        string resourceId,
        Dictionary<string, string>? filters,
        int limit,
        int offset,
        CancellationToken ct)
    {
        var queryParams = $"datastore_search?resource_id={resourceId}&limit={limit}&offset={offset}";
        if (filters is { Count: > 0 })
        {
            var filtersJson = JsonSerializer.Serialize(filters);
            queryParams += $"&filters={Uri.EscapeDataString(filtersJson)}";
        }

        return await FetchWithRetryAsync(queryParams, ct);
    }

    private async Task<CkanResult> FetchWithRetryAsync(string relativeUrl, CancellationToken ct)
    {
        await RateLimiter.WaitAsync(ct);
        try
        {
            for (var attempt = 1; attempt <= MaxRetries; attempt++)
            {
                try
                {
                    var client = httpClientFactory.CreateClient("TorontoOpenData");
                    var response = await client.GetAsync(relativeUrl, ct);

                    if ((int)response.StatusCode >= 500 && attempt < MaxRetries)
                    {
                        logger.LogWarning("CKAN API returned {Status}, retry {Attempt}/{Max}",
                            response.StatusCode, attempt, MaxRetries);
                        await Task.Delay(1000 * attempt, ct);
                        continue;
                    }

                    response.EnsureSuccessStatusCode();
                    var json = await response.Content.ReadAsStringAsync(ct);
                    var doc = JsonDocument.Parse(json);
                    var result = doc.RootElement.GetProperty("result");

                    var records = new List<Dictionary<string, JsonElement>>();
                    foreach (var record in result.GetProperty("records").EnumerateArray())
                    {
                        var dict = new Dictionary<string, JsonElement>();
                        foreach (var prop in record.EnumerateObject())
                        {
                            dict[prop.Name] = prop.Value.Clone();
                        }
                        records.Add(dict);
                    }

                    var total = result.GetProperty("total").GetInt32();
                    return new CkanResult(records, total);
                }
                catch (Exception ex) when (attempt < MaxRetries && ex is not OperationCanceledException)
                {
                    logger.LogWarning(ex, "CKAN request failed, retry {Attempt}/{Max}", attempt, MaxRetries);
                    await Task.Delay(1000 * attempt, ct);
                }
            }

            throw new InvalidOperationException($"Exhausted retries for CKAN query: {relativeUrl}");
        }
        finally
        {
            // 500ms rate limit between requests
            _ = Task.Delay(500).ContinueWith(_ => RateLimiter.Release());
        }
    }

    public record CkanResult(List<Dictionary<string, JsonElement>> Records, int Total);
}

// Extension helpers for reading CKAN record fields
public static class CkanRecordExtensions
{
    public static string GetString(this Dictionary<string, JsonElement> record, params string[] keys)
    {
        foreach (var key in keys)
        {
            if (record.TryGetValue(key, out var val) && val.ValueKind == JsonValueKind.String)
            {
                var s = val.GetString()?.Trim();
                if (!string.IsNullOrEmpty(s) && !s.Equals("None", StringComparison.OrdinalIgnoreCase)) return s;
            }
        }
        return "";
    }

    public static int? GetInt(this Dictionary<string, JsonElement> record, params string[] keys)
    {
        foreach (var key in keys)
        {
            if (record.TryGetValue(key, out var val))
            {
                if (val.ValueKind == JsonValueKind.Number && val.TryGetInt32(out var n)) return n;
                if (val.ValueKind == JsonValueKind.String && int.TryParse(val.GetString(), out var parsed)) return parsed;
            }
        }
        return null;
    }

    public static double? GetDouble(this Dictionary<string, JsonElement> record, params string[] keys)
    {
        foreach (var key in keys)
        {
            if (record.TryGetValue(key, out var val))
            {
                if (val.ValueKind == JsonValueKind.Number && val.TryGetDouble(out var n)) return n;
                if (val.ValueKind == JsonValueKind.String && double.TryParse(val.GetString(), out var parsed)) return parsed;
            }
        }
        return null;
    }
}
