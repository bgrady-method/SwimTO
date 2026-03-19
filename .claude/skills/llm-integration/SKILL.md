---
name: llm-integration
description: Integrate Claude/LLMs into .NET applications — Anthropic.SDK, tool use, streaming, RAG, prompt engineering patterns
user_invocable: true
allowedTools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - WebSearch
  - WebFetch
---

# LLM Integration Skill

You help integrate Large Language Models (primarily Claude via the Anthropic API) into C# .NET applications. Covers API client setup, prompt engineering, tool use (function calling), streaming, RAG, and frontend integration.

## Quick Start: Anthropic.SDK in .NET

### 1. Install Package

```bash
dotnet add package Anthropic.SDK
```

### 2. Configure API Key

`appsettings.Development.json`:
```json
{
  "Anthropic": {
    "ApiKey": "sk-ant-..."
  }
}
```

**Never commit API keys.** Add to `.gitignore`:
```
appsettings.Development.json
```

Use environment variables or user secrets for local dev:
```bash
dotnet user-secrets set "Anthropic:ApiKey" "sk-ant-..."
```

### 3. Register Client

```csharp
// Program.cs
builder.Services.AddSingleton(sp =>
{
    var apiKey = builder.Configuration["Anthropic:ApiKey"]
        ?? throw new InvalidOperationException("Anthropic API key not configured");
    return new AnthropicClient(apiKey);
});
```

### 4. Basic Usage

```csharp
public class ChatService(AnthropicClient client)
{
    public async Task<string> GetResponseAsync(string userMessage)
    {
        var messages = new List<Message>
        {
            new(RoleType.User, userMessage)
        };

        var parameters = new MessageParameters
        {
            Model = AnthropicModels.Claude35Sonnet,
            MaxTokens = 1024,
            Messages = messages,
            System = new List<SystemMessage>
            {
                new("You are a helpful assistant for City of Toronto services.")
            }
        };

        var response = await client.Messages.GetClaudeMessageAsync(parameters);
        return response.Content.First().Text;
    }
}
```

## Model Selection Guide

| Model | Use Case | Speed | Cost | ID |
|-------|----------|-------|------|----|
| **Claude 4.5 Haiku** | Fast responses, simple tasks, classification | Fastest | Lowest | `claude-haiku-4-5-20251001` |
| **Claude Sonnet 4.6** | Balanced — most tasks, good reasoning + speed | Fast | Medium | `claude-sonnet-4-6-20250415` |
| **Claude Opus 4.6** | Complex reasoning, analysis, code generation | Slower | Highest | `claude-opus-4-6-20250415` |

**Default for MVP:** Sonnet for most features. Haiku for high-volume/low-complexity tasks.

## Prompt Engineering Patterns

### System Prompt Template
```csharp
var systemPrompt = """
    You are a helpful assistant for the City of Toronto community services application.

    <role>
    You help residents find community centers, recreation programs, libraries,
    and public services near them.
    </role>

    <guidelines>
    - Always provide specific addresses and contact information when available
    - Include transit directions (TTC) when relevant
    - If you're unsure about current hours or availability, say so
    - Respond in the same language the user writes in (English or French)
    </guidelines>

    <context>
    Current date: {DateTime.Now:yyyy-MM-dd}
    User's neighborhood: {neighborhood}
    </context>
    """;
```

### Few-Shot Pattern
```csharp
var messages = new List<Message>
{
    new(RoleType.User, "Where can I swim near Bloor and Yonge?"),
    new(RoleType.Assistant, """
        The closest community center with a pool near Bloor and Yonge is:

        **Central YMCA** - 20 Grosvenor St (5 min walk)
        - Lane swim, aquafit, and family swim available
        - TTC: Wellesley Station (2 min walk)

        **University of Toronto Athletic Centre** - 55 Harbord St (15 min walk)
        - Public swim times available
        - TTC: St. George Station
        """),
    new(RoleType.User, actualUserQuestion)  // The real question
};
```

## Tool Use (Function Calling)

### Define Tools
```csharp
var tools = new List<Tool>
{
    new Tool
    {
        Name = "search_community_centers",
        Description = "Search for community centers near a location in Toronto",
        InputSchema = new InputSchema
        {
            Type = "object",
            Properties = new Dictionary<string, Property>
            {
                ["location"] = new() { Type = "string", Description = "Neighborhood, intersection, or postal code" },
                ["activity"] = new() { Type = "string", Description = "Activity type (e.g., swimming, basketball, fitness)" },
                ["radius_km"] = new() { Type = "number", Description = "Search radius in kilometers (default: 2)" }
            },
            Required = new List<string> { "location" }
        }
    }
};
```

### Handle Tool Calls
```csharp
var parameters = new MessageParameters
{
    Model = AnthropicModels.Claude35Sonnet,
    MaxTokens = 1024,
    Messages = messages,
    Tools = tools
};

var response = await client.Messages.GetClaudeMessageAsync(parameters);

// Check if Claude wants to use a tool
if (response.StopReason == "tool_use")
{
    var toolUse = response.Content.OfType<ToolUseContent>().First();

    // Execute the tool
    var toolResult = toolUse.Name switch
    {
        "search_community_centers" => await SearchCenters(toolUse.Input),
        _ => throw new InvalidOperationException($"Unknown tool: {toolUse.Name}")
    };

    // Send tool result back to Claude
    messages.Add(new Message(RoleType.Assistant, response.Content));
    messages.Add(new Message(RoleType.User, new List<ContentBase>
    {
        new ToolResultContent
        {
            ToolUseId = toolUse.Id,
            Content = toolResult
        }
    }));

    // Get final response
    var finalResponse = await client.Messages.GetClaudeMessageAsync(parameters with
    {
        Messages = messages
    });
}
```

### Multi-Turn Tool Loop
```csharp
public async Task<string> RunAgentLoopAsync(string userMessage, List<Tool> tools, int maxIterations = 5)
{
    var messages = new List<Message> { new(RoleType.User, userMessage) };

    for (int i = 0; i < maxIterations; i++)
    {
        var response = await client.Messages.GetClaudeMessageAsync(new MessageParameters
        {
            Model = AnthropicModels.Claude35Sonnet,
            MaxTokens = 4096,
            Messages = messages,
            Tools = tools
        });

        if (response.StopReason == "end_turn")
        {
            return response.Content.OfType<TextContent>().First().Text;
        }

        if (response.StopReason == "tool_use")
        {
            messages.Add(new Message(RoleType.Assistant, response.Content));

            var toolResults = new List<ContentBase>();
            foreach (var toolUse in response.Content.OfType<ToolUseContent>())
            {
                var result = await ExecuteToolAsync(toolUse);
                toolResults.Add(new ToolResultContent
                {
                    ToolUseId = toolUse.Id,
                    Content = result
                });
            }

            messages.Add(new Message(RoleType.User, toolResults));
        }
    }

    return "Max iterations reached.";
}
```

## Streaming Responses to Frontend

### Backend: Server-Sent Events (SSE)

```csharp
app.MapGet("/api/chat/stream", async (string message, AnthropicClient client, HttpContext ctx) =>
{
    ctx.Response.ContentType = "text/event-stream";
    ctx.Response.Headers.CacheControl = "no-cache";

    var parameters = new MessageParameters
    {
        Model = AnthropicModels.Claude35Sonnet,
        MaxTokens = 1024,
        Messages = new List<Message> { new(RoleType.User, message) },
        Stream = true
    };

    await foreach (var evt in client.Messages.StreamClaudeMessageAsync(parameters))
    {
        if (evt is ContentBlockDelta delta && delta.Delta?.Text is string text)
        {
            await ctx.Response.WriteAsync($"data: {JsonSerializer.Serialize(new { text })}\n\n");
            await ctx.Response.Body.FlushAsync();
        }
    }

    await ctx.Response.WriteAsync("data: [DONE]\n\n");
    await ctx.Response.Body.FlushAsync();
});
```

### Frontend: EventSource Consumer

```typescript
// client/src/hooks/useChatStream.ts
import { useState, useCallback } from 'react';

export function useChatStream() {
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(async (message: string) => {
    setResponse('');
    setIsStreaming(true);

    const eventSource = new EventSource(
      `/api/chat/stream?message=${encodeURIComponent(message)}`
    );

    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        eventSource.close();
        setIsStreaming(false);
        return;
      }
      const { text } = JSON.parse(event.data);
      setResponse(prev => prev + text);
    };

    eventSource.onerror = () => {
      eventSource.close();
      setIsStreaming(false);
    };
  }, []);

  return { response, isStreaming, sendMessage };
}
```

## RAG (Retrieval-Augmented Generation) — Simple Approach

For MVP, skip vector databases. Use a simple approach:

### 1. Document Storage
Store documents as files or in SQLite with full text.

### 2. Simple Search
Use keyword matching or SQLite FTS5 for full-text search:

```csharp
public class SimpleDocumentSearch(AppDbContext db)
{
    public async Task<List<Document>> SearchAsync(string query, int topK = 5)
    {
        // Simple keyword matching — upgrade to FTS5 or embeddings later
        var keywords = query.ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return await db.Documents
            .Where(d => keywords.Any(k => d.Content.ToLower().Contains(k)))
            .OrderByDescending(d => keywords.Count(k => d.Content.ToLower().Contains(k)))
            .Take(topK)
            .ToListAsync();
    }
}
```

### 3. Context Injection
```csharp
var relevantDocs = await search.SearchAsync(userQuestion);
var context = string.Join("\n---\n", relevantDocs.Select(d => d.Content));

var systemPrompt = $"""
    Answer the user's question based on the following context documents.
    If the answer isn't in the context, say so.

    <context>
    {context}
    </context>
    """;
```

## Error Handling

```csharp
public async Task<string> SafeCallAsync(string message)
{
    try
    {
        return await GetResponseAsync(message);
    }
    catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
    {
        // Rate limited — wait and retry
        await Task.Delay(TimeSpan.FromSeconds(5));
        return await GetResponseAsync(message);
    }
    catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.ServiceUnavailable)
    {
        // API overloaded
        return "The AI service is currently busy. Please try again in a moment.";
    }
    catch (TaskCanceledException)
    {
        return "The request timed out. Please try a shorter question.";
    }
}
```

## Token Counting & Cost Estimation

Rough estimates (Claude Sonnet):
- **Input:** ~$3 per 1M tokens
- **Output:** ~$15 per 1M tokens
- **1 token ≈ 4 characters** (English text)
- **Rule of thumb:** A typical chat exchange (500 word prompt + 300 word response) ≈ $0.005

For MVP, don't worry about token counting. Just set `MaxTokens` reasonably and monitor usage in the Anthropic dashboard.

## Workflow

1. **Identify the LLM use case** (chat, search, classification, extraction, tool use)
2. **Install `Anthropic.SDK`** and configure API key
3. **Design prompts** with system prompt, few-shot examples, and XML tags
4. **Add tool definitions** if the LLM needs to call functions
5. **Implement streaming** via SSE for chat-like interfaces
6. **Add RAG** if the LLM needs domain-specific knowledge
7. **Connect frontend** with streaming consumer hook
8. **Add error handling** for rate limits and timeouts

## Integration with Other Skills

- **`dotnet-react-scaffold`** → installs Anthropic.SDK package
- **`toronto-web-navigator`** → provides Toronto data that can be used as RAG context
- **`map-integration`** → LLM can generate map queries or interpret location-based questions
- **`web-research`** → research specific Claude API features or patterns
