using Api.Models.Dto;
using Api.Services;

namespace Api.Endpoints;

public static class ChatEndpoints
{
    public static void MapChatEndpoints(this WebApplication app)
    {
        app.MapPost("/api/chat", async (ChatRequest request, ChatService chatService, IConfiguration config, HttpContext httpContext) =>
        {
            var apiKey = config["Anthropic:ApiKey"] ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY");
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return Results.Json(new { error = "Chat is unavailable. Set the ANTHROPIC_API_KEY environment variable to enable it." }, statusCode: 503);
            }

            var sessionId = request.SessionId ?? Guid.NewGuid().ToString();

            httpContext.Response.ContentType = "text/event-stream";
            httpContext.Response.Headers.CacheControl = "no-cache";
            httpContext.Response.Headers.Connection = "keep-alive";

            try
            {
                await foreach (var sseEvent in chatService.StreamChatAsync(
                    request.Message, sessionId, request.UserLocation?.Lat, request.UserLocation?.Lng))
                {
                    // SSE spec: newlines in data must each be on their own "data:" line
                    var safeData = sseEvent.Data.Replace("\n", "\ndata: ");
                    await httpContext.Response.WriteAsync($"event: {sseEvent.Type}\ndata: {safeData}\n\n");
                    await httpContext.Response.Body.FlushAsync();
                }
            }
            catch (Exception ex)
            {
                await httpContext.Response.WriteAsync($"event: error\ndata: {ex.Message}\n\n");
                await httpContext.Response.WriteAsync("event: done\ndata: \n\n");
                await httpContext.Response.Body.FlushAsync();
            }

            return Results.Empty;
        });
    }
}
