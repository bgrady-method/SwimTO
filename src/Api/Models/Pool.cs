namespace Api.Models;

public class Pool
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Address { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public required string PoolType { get; set; } // "Indoor" or "Outdoor"
    public double? LengthMeters { get; set; }
    public int? LaneCount { get; set; }
    public bool IsAccessible { get; set; }
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public int? TorontoLocationId { get; set; }
    public bool IsActive { get; set; } = true;

    public List<Schedule> Schedules { get; set; } = [];
}
