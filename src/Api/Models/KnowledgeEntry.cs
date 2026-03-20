namespace Api.Models;

public class KnowledgeEntry
{
    public int Id { get; set; }
    public int? PoolId { get; set; }
    public required string Topic { get; set; }  // "amenities", "renovation", "policy", "hours"
    public required string Fact { get; set; }
    public string? SourceUrl { get; set; }
    public double Confidence { get; set; }      // 0.0-1.0, set by challenger/arbiter
    public DateTime DiscoveredAt { get; set; } = DateTime.UtcNow;
    public DateTime? VerifiedAt { get; set; }
    public Pool? Pool { get; set; }
}
