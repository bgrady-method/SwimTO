using System.Text.Json;
using System.Text.Json.Nodes;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using Api.Models.Dto;

namespace Api.Services;

public class ChatToolExecutor(
    PoolSearchService searchService,
    IServiceProvider serviceProvider,
    WebFetchService webFetchService,
    KnowledgeService knowledgeService,
    IConfiguration config,
    ILogger<ChatToolExecutor> logger)
{
    private int _fetchCount;

    public async Task<string> ExecuteToolAsync(string toolName, string toolInput)
    {
        return toolName switch
        {
            "search_pools" => await ExecuteSearchPools(toolInput),
            "get_pool_details" => await ExecuteGetPoolDetails(toolInput),
            "fetch_webpage" => await ExecuteFetchWebpage(toolInput),
            "save_knowledge" => await ExecuteSaveKnowledge(toolInput),
            "get_knowledge" => await ExecuteGetKnowledge(toolInput),
            "get_pool_amenities" => await ExecuteGetPoolAmenities(toolInput),
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
            Attributes = new AttributeFilter { PoolType = input.PoolType, Amenities = input.Amenities },
        };

        var response = await searchService.SearchAsync(request);
        var top = response.Results.Take(10).Select(r => new
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
            r.Website,
            r.ImageUrl,
            r.Amenities,
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
            pool.ImageUrl,
            Amenities = AmenityItem.DeserializeJson(pool.AmenitiesJson),
            Schedules = schedules.Select(s => new
            {
                s.SwimType,
                s.DayOfWeek,
                StartTime = s.StartTime.ToString("HH:mm"),
                EndTime = s.EndTime.ToString("HH:mm"),
            }),
        });
    }

    private async Task<string> ExecuteFetchWebpage(string toolInput)
    {
        if (_fetchCount >= 3)
            return JsonSerializer.Serialize(new { error = "Maximum of 3 web fetches per session reached." });

        var input = JsonSerializer.Deserialize<JsonElement>(toolInput);
        if (!input.TryGetProperty("url", out var urlProp))
            return JsonSerializer.Serialize(new { error = "url required" });

        var url = urlProp.GetString();
        if (string.IsNullOrWhiteSpace(url))
            return JsonSerializer.Serialize(new { error = "url must not be empty" });

        _fetchCount++;
        var content = await webFetchService.FetchAsync(url);
        return JsonSerializer.Serialize(new { url, content });
    }

    private async Task<string> ExecuteSaveKnowledge(string toolInput)
    {
        var input = JsonSerializer.Deserialize<JsonElement>(toolInput);

        if (!input.TryGetProperty("topic", out var topicProp) || !input.TryGetProperty("fact", out var factProp))
            return JsonSerializer.Serialize(new { error = "topic and fact are required" });

        var topic = topicProp.GetString()?.Trim();
        var fact = factProp.GetString()?.Trim();
        if (string.IsNullOrEmpty(topic) || string.IsNullOrEmpty(fact))
            return JsonSerializer.Serialize(new { error = "topic and fact must not be empty" });

        if (fact.Length > 2000)
            return JsonSerializer.Serialize(new { error = "fact must be 2000 characters or fewer" });

        int? poolId = input.TryGetProperty("pool_id", out var pidProp) && pidProp.ValueKind == JsonValueKind.Number
            ? pidProp.GetInt32() : null;
        string? sourceUrl = input.TryGetProperty("source_url", out var srcProp) && srcProp.ValueKind == JsonValueKind.String
            ? srcProp.GetString() : null;

        // Adversarial verification via Challenger Claude
        var (confidence, verified, reason) = await ChallengerVerifyAsync(fact, sourceUrl);

        if (!verified || confidence < 0.6)
        {
            logger.LogInformation("Challenger rejected knowledge: {Reason} (confidence={Confidence})", reason, confidence);
            return JsonSerializer.Serialize(new
            {
                saved = false,
                confidence,
                reason = $"Fact not saved — Challenger verification failed: {reason}",
            });
        }

        var entry = await knowledgeService.SaveAsync(poolId, topic, fact, sourceUrl, confidence);
        return JsonSerializer.Serialize(new
        {
            saved = true,
            id = entry.Id,
            confidence,
            reason,
        });
    }

    private async Task<(double confidence, bool verified, string reason)> ChallengerVerifyAsync(string fact, string? sourceUrl)
    {
        try
        {
            var apiKey = config["Anthropic:ApiKey"] ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY") ?? "";
            var client = new AnthropicClient(apiKey);

            var sourceNote = sourceUrl != null ? " from " + sourceUrl : "";
            var prompt = $$"""
                A fact was extracted{{sourceNote}}: '{{fact}}'.
                Rate confidence 0.0-1.0. Is this specific, verifiable, and consistent with what a Toronto pool page would say?
                Output JSON only: { "confidence": 0.X, "verified": true/false, "reason": "..." }
                """;

            var parameters = new MessageParameters
            {
                Model = "claude-sonnet-4-20250514",
                MaxTokens = 256,
                Temperature = 0m,
                Messages = [new Message(RoleType.User, prompt)],
            };

            var response = await client.Messages.GetClaudeMessageAsync(parameters);
            var text = response.Message?.ToString()?.Trim() ?? "";

            // Extract JSON from response (handle markdown code blocks)
            var jsonStart = text.IndexOf('{');
            var jsonEnd = text.LastIndexOf('}');
            if (jsonStart >= 0 && jsonEnd > jsonStart)
            {
                var jsonStr = text[jsonStart..(jsonEnd + 1)];
                var result = JsonSerializer.Deserialize<JsonElement>(jsonStr);

                var confidence = result.TryGetProperty("confidence", out var confProp) ? confProp.GetDouble() : 0.0;
                var verified = result.TryGetProperty("verified", out var verProp) && verProp.GetBoolean();
                var reason = result.TryGetProperty("reason", out var reasonProp) ? reasonProp.GetString() ?? "" : "";
                return (confidence, verified, reason);
            }

            return (0.0, false, "Challenger returned invalid response format");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Challenger verification failed");
            return (0.0, false, $"Challenger error: {ex.Message}");
        }
    }

    private async Task<string> ExecuteGetKnowledge(string toolInput)
    {
        var input = JsonSerializer.Deserialize<JsonElement>(toolInput);

        int? poolId = input.TryGetProperty("pool_id", out var pidProp) && pidProp.ValueKind == JsonValueKind.Number
            ? pidProp.GetInt32() : null;
        string? topic = input.TryGetProperty("topic", out var topProp) && topProp.ValueKind == JsonValueKind.String
            ? topProp.GetString() : null;
        string? query = input.TryGetProperty("query", out var qProp) && qProp.ValueKind == JsonValueKind.String
            ? qProp.GetString() : null;

        if (poolId.HasValue)
        {
            var entries = await knowledgeService.GetForPoolAsync(poolId.Value, topic);
            return JsonSerializer.Serialize(entries.Select(e => new
            {
                e.Id, e.PoolId, e.Topic, e.Fact, e.SourceUrl, e.Confidence, e.DiscoveredAt,
            }));
        }

        if (!string.IsNullOrEmpty(query))
        {
            var entries = await knowledgeService.SearchAsync(query);
            return JsonSerializer.Serialize(entries.Select(e => new
            {
                e.Id, e.PoolId, e.Topic, e.Fact, e.SourceUrl, e.Confidence, e.DiscoveredAt,
            }));
        }

        return JsonSerializer.Serialize(new { error = "Provide pool_id or query" });
    }

    private async Task<string> ExecuteGetPoolAmenities(string toolInput)
    {
        var input = JsonSerializer.Deserialize<JsonElement>(toolInput);
        if (!input.TryGetProperty("pool_id", out var poolIdProp))
            return JsonSerializer.Serialize(new { error = "pool_id required" });

        var poolId = poolIdProp.GetInt32();

        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<Data.AppDbContext>();
        var pool = await db.Pools.FindAsync(poolId);
        if (pool is null) return JsonSerializer.Serialize(new { error = "Pool not found" });

        var amenities = AmenityItem.DeserializeJson(pool.AmenitiesJson);

        return JsonSerializer.Serialize(new
        {
            poolId = pool.Id,
            name = pool.Name,
            amenities,
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
    public string[]? Amenities { get; set; }
}
