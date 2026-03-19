namespace Api.Models.Dto;

public class ChatRequest
{
    public required string Message { get; set; }
    public string? SessionId { get; set; }
    public LocationFilter? UserLocation { get; set; }
}
