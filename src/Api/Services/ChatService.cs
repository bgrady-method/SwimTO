using System.Text.Json;
using System.Text.Json.Nodes;
using Anthropic.SDK;
using Anthropic.SDK.Common;
using Anthropic.SDK.Messaging;
using Api.Data;
using Api.Models;
using Microsoft.EntityFrameworkCore;
using Function = Anthropic.SDK.Common.Function;
using Tool = Anthropic.SDK.Common.Tool;

namespace Api.Services;

public class ChatService(
    AppDbContext db,
    ChatToolExecutor toolExecutor,
    IConfiguration config)
{
    private const string SystemPrompt = """
        You are SwimTO, a helpful assistant that helps people find public swimming pools and swim times in Toronto, Canada.
        You have access to a database of ~40 Toronto public pools with their schedules.

        When users ask about swimming, use the search_pools tool to find relevant pools. When they ask for details about a specific pool, use get_pool_details.

        Be friendly, concise, and helpful. Format pool information clearly. When listing pools, include:
        - Pool name and distance
        - Swim type and times
        - Key attributes (indoor/outdoor, lane count, length)

        Days of week: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday.

        If the user mentions a location or intersection, use the lat/lng from their location context if available.
        Always try to be specific about times and days when presenting results.
        """;

    private static readonly IList<Tool> Tools = new List<Tool>
    {
        new Function(
            "search_pools",
            "Search for Toronto public pools by swim type, time, day, location, and pool attributes. Returns ranked results.",
            JsonNode.Parse("""
            {
                "type": "object",
                "properties": {
                    "swim_types": { "type": "array", "items": { "type": "string", "enum": ["Lane Swim", "Leisure Swim", "Aquafit", "Women Only", "Older Adult", "Family"] }, "description": "Filter by swim session types" },
                    "days_of_week": { "type": "array", "items": { "type": "integer", "minimum": 0, "maximum": 6 }, "description": "Filter by days (0=Sun, 6=Sat)" },
                    "time_from": { "type": "string", "description": "Earliest start time, format HH:mm" },
                    "time_to": { "type": "string", "description": "Latest start time, format HH:mm" },
                    "lat": { "type": "number", "description": "User latitude for proximity search" },
                    "lng": { "type": "number", "description": "User longitude for proximity search" },
                    "radius_km": { "type": "number", "description": "Search radius in km (default 5)" },
                    "pool_type": { "type": "string", "enum": ["Indoor", "Outdoor"], "description": "Indoor or Outdoor only" }
                }
            }
            """)!
        ),
        new Function(
            "get_pool_details",
            "Get full details and complete schedule for a specific pool by ID.",
            JsonNode.Parse("""
            {
                "type": "object",
                "properties": {
                    "pool_id": { "type": "integer", "description": "The pool ID" }
                },
                "required": ["pool_id"]
            }
            """)!
        ),
    };

    public async IAsyncEnumerable<SseEvent> StreamChatAsync(string message, string sessionId, double? userLat, double? userLng)
    {
        // Load or create session
        var session = await db.ChatSessions
            .Include(s => s.Messages)
            .FirstOrDefaultAsync(s => s.SessionId == sessionId);

        if (session is null)
        {
            session = new ChatSession { SessionId = sessionId };
            db.ChatSessions.Add(session);
            await db.SaveChangesAsync();
        }

        // Store user message
        session.Messages.Add(new ChatMessage { Role = "user", Content = message, ChatSessionId = session.Id });
        session.LastMessageAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        // Build message history (last 10 exchanges)
        var history = session.Messages
            .OrderByDescending(m => m.CreatedAt)
            .Take(20)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new Message(
                m.Role == "user" ? RoleType.User : RoleType.Assistant,
                m.Content))
            .ToList();

        // Add location context to system prompt
        var systemWithLocation = SystemPrompt;
        if (userLat.HasValue && userLng.HasValue)
            systemWithLocation += $"\n\nThe user's current location is approximately lat={userLat.Value}, lng={userLng.Value}.";

        var apiKey = config["Anthropic:ApiKey"] ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY") ?? "";
        var client = new AnthropicClient(apiKey);

        var fullResponse = "";
        var poolReferences = new List<object>();
        string? lastSearchPoolsInput = null;

        // Tool use loop
        var currentMessages = history;
        var maxIterations = 5;

        for (int i = 0; i < maxIterations; i++)
        {
            var parameters = new MessageParameters
            {
                Model = "claude-sonnet-4-20250514",
                MaxTokens = 1024,
                System = [new SystemMessage(systemWithLocation)],
                Messages = currentMessages,
                Tools = Tools,
                Stream = true,
            };

            var responseText = "";
            var toolUseBlocks = new List<(string id, string name, string input)>();
            string? currentToolId = null;
            string? currentToolName = null;
            var currentToolInput = "";

            await foreach (var res in client.Messages.StreamClaudeMessageAsync(parameters))
            {
                if (res.Type == "content_block_start" && res.ContentBlock?.Type == "tool_use")
                {
                    currentToolId = res.ContentBlock.Id;
                    currentToolName = res.ContentBlock.Name;
                    currentToolInput = "";
                    yield return new SseEvent("tool_call", JsonSerializer.Serialize(new { tool = currentToolName }));
                }
                else if (res.Delta?.Text != null)
                {
                    responseText += res.Delta.Text;
                    yield return new SseEvent("text", res.Delta.Text);
                }
                else if (res.Delta?.PartialJson != null)
                {
                    currentToolInput += res.Delta.PartialJson;
                }
                else if (res.Type == "content_block_stop")
                {
                    if (currentToolId != null && currentToolName != null)
                    {
                        toolUseBlocks.Add((currentToolId, currentToolName, currentToolInput));
                        currentToolId = null;
                        currentToolName = null;
                        currentToolInput = "";
                    }
                }
            }

            if (toolUseBlocks.Count == 0)
            {
                fullResponse = responseText;
                break;
            }

            // Execute tools and continue conversation
            var assistantContent = new List<ContentBase>();
            if (!string.IsNullOrEmpty(responseText))
                assistantContent.Add(new TextContent { Text = responseText });
            foreach (var (id, name, input) in toolUseBlocks)
                assistantContent.Add(new ToolUseContent
                {
                    Id = id,
                    Name = name,
                    Input = JsonNode.Parse(string.IsNullOrWhiteSpace(input) ? "{}" : input)
                });

            currentMessages = [.. currentMessages, new Message { Role = RoleType.Assistant, Content = assistantContent }];

            var toolResultContent = new List<ContentBase>();
            foreach (var (id, name, input) in toolUseBlocks)
            {
                var result = await toolExecutor.ExecuteToolAsync(name, string.IsNullOrWhiteSpace(input) ? "{}" : input);
                yield return new SseEvent("tool_result", JsonSerializer.Serialize(new { tool = name, resultPreview = result.Length > 200 ? result[..200] + "..." : result }));

                if (name == "search_pools")
                    lastSearchPoolsInput = string.IsNullOrWhiteSpace(input) ? "{}" : input;

                // Extract pool references for map
                try
                {
                    var parsed = JsonSerializer.Deserialize<JsonElement>(result);
                    if (parsed.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var item in parsed.EnumerateArray())
                        {
                            if (item.TryGetProperty("PoolId", out var pid) &&
                                item.TryGetProperty("Latitude", out var plat) &&
                                item.TryGetProperty("Longitude", out var plng) &&
                                item.TryGetProperty("Name", out var pname))
                            {
                                item.TryGetProperty("Address", out var paddr);
                                item.TryGetProperty("PoolType", out var ptype);
                                item.TryGetProperty("LengthMeters", out var plen);
                                item.TryGetProperty("LaneCount", out var planes);
                                item.TryGetProperty("DistanceKm", out var pdist);
                                item.TryGetProperty("Website", out var pweb);
                                item.TryGetProperty("ImageUrl", out var pimg);
                                poolReferences.Add(new
                                {
                                    poolId = pid.GetInt32(),
                                    lat = plat.GetDouble(),
                                    lng = plng.GetDouble(),
                                    name = pname.GetString(),
                                    address = paddr.ValueKind == JsonValueKind.String ? paddr.GetString() : null,
                                    poolType = ptype.ValueKind == JsonValueKind.String ? ptype.GetString() : null,
                                    lengthMeters = plen.ValueKind == JsonValueKind.Number ? plen.GetDouble() : (double?)null,
                                    laneCount = planes.ValueKind == JsonValueKind.Number ? planes.GetInt32() : (int?)null,
                                    distanceKm = pdist.ValueKind == JsonValueKind.Number ? pdist.GetDouble() : (double?)null,
                                    website = pweb.ValueKind == JsonValueKind.String ? pweb.GetString() : null,
                                    imageUrl = pimg.ValueKind == JsonValueKind.String ? pimg.GetString() : null,
                                });
                            }
                        }
                    }
                }
                catch { /* ignore parse errors */ }

                toolResultContent.Add(new ToolResultContent
                {
                    ToolUseId = id,
                    Content = [new TextContent { Text = result }]
                });
            }

            currentMessages = [.. currentMessages, new Message { Role = RoleType.User, Content = toolResultContent }];
            toolUseBlocks.Clear();
        }

        // Send applied filters so Explore tab can sync
        if (lastSearchPoolsInput != null)
            yield return new SseEvent("applied_filters", lastSearchPoolsInput);

        // Send pool references for map highlighting
        if (poolReferences.Count > 0)
            yield return new SseEvent("pool_references", JsonSerializer.Serialize(poolReferences));

        // Save assistant response
        if (!string.IsNullOrEmpty(fullResponse))
        {
            session.Messages.Add(new ChatMessage { Role = "assistant", Content = fullResponse, ChatSessionId = session.Id });
            await db.SaveChangesAsync();
        }

        yield return new SseEvent("done", "");
    }
}

public record SseEvent(string Type, string Data);
