namespace Api.Models;

public class ChatMessage
{
    public int Id { get; set; }
    public int ChatSessionId { get; set; }
    public required string Role { get; set; } // "user" or "assistant"
    public required string Content { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ChatSession ChatSession { get; set; } = null!;
}
