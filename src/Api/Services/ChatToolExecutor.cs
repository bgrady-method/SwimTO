using System.Text.Json;
using Api.Models.Dto;

namespace Api.Services;

public class ChatToolExecutor(PoolSearchService searchService, IServiceProvider serviceProvider)
{
    public async Task<string> ExecuteToolAsync(string toolName, string toolInput)
    {
        return toolName switch
        {
            "search_pools" => await ExecuteSearchPools(toolInput),
            "get_pool_details" => await ExecuteGetPoolDetails(toolInput),
            _ => JsonSerializer.Serialize(new { error = $"Unknown tool: {toolName}" }),
        };
    }

    private async Task<string> ExecuteSearchPools(string toolInput)
    {
        var input = JsonSerializer.Deserialize<PoolSearchToolInput>(toolInput, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        if (input is null) return JsonSerializer.Serialize(new { error = "Invalid input" });

        var request = new PoolSearchRequest
        {
            SwimTypes = input.SwimTypes,
            DaysOfWeek = input.DaysOfWeek,
            TimeFrom = input.TimeFrom != null ? TimeOnly.Parse(input.TimeFrom) : null,
            TimeTo = input.TimeTo != null ? TimeOnly.Parse(input.TimeTo) : null,
            Location = input.Lat.HasValue && input.Lng.HasValue
                ? new LocationFilter { Lat = input.Lat.Value, Lng = input.Lng.Value, RadiusKm = input.RadiusKm ?? 5.0 }
                : null,
            Attributes = new AttributeFilter { PoolType = input.PoolType },
        };

        var results = await searchService.SearchAsync(request);
        var top = results.Take(10).Select(r => new
        {
            r.PoolId,
            r.Name,
            r.Address,
            r.DistanceKm,
            r.PoolType,
            r.LengthMeters,
            r.LaneCount,
            r.IsAccessible,
            r.CompositeScore,
            r.Latitude,
            r.Longitude,
            NextSessions = r.MatchingSchedules.Take(5),
        });

        return JsonSerializer.Serialize(top);
    }

    private async Task<string> ExecuteGetPoolDetails(string toolInput)
    {
        var input = JsonSerializer.Deserialize<JsonElement>(toolInput);
        if (!input.TryGetProperty("pool_id", out var poolIdProp)) return JsonSerializer.Serialize(new { error = "pool_id required" });
        var poolId = poolIdProp.GetInt32();

        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<Data.AppDbContext>();
        var pool = await db.Pools.FindAsync(poolId);
        if (pool is null) return JsonSerializer.Serialize(new { error = "Pool not found" });

        var schedules = db.Schedules.Where(s => s.PoolId == poolId).ToList();

        return JsonSerializer.Serialize(new
        {
            pool.Id,
            pool.Name,
            pool.Address,
            pool.Latitude,
            pool.Longitude,
            pool.PoolType,
            pool.LengthMeters,
            pool.LaneCount,
            pool.IsAccessible,
            pool.Phone,
            pool.Website,
            Schedules = schedules.Select(s => new
            {
                s.SwimType,
                s.DayOfWeek,
                StartTime = s.StartTime.ToString("HH:mm"),
                EndTime = s.EndTime.ToString("HH:mm"),
            }),
        });
    }
}

public class PoolSearchToolInput
{
    public string[]? SwimTypes { get; set; }
    public int[]? DaysOfWeek { get; set; }
    public string? TimeFrom { get; set; }
    public string? TimeTo { get; set; }
    public double? Lat { get; set; }
    public double? Lng { get; set; }
    public double? RadiusKm { get; set; }
    public string? PoolType { get; set; }
}
