namespace Api.Models.Dto;

public class PoolSearchResult
{
    public int PoolId { get; set; }
    public required string Name { get; set; }
    public required string Address { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public required string PoolType { get; set; }
    public double? LengthMeters { get; set; }
    public int? LaneCount { get; set; }
    public bool IsAccessible { get; set; }
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public string? ImageUrl { get; set; }
    public AmenityItem[]? Amenities { get; set; }
    public double DistanceKm { get; set; }
    public double CompositeScore { get; set; }
    public ScoreBreakdown Scores { get; set; } = new();
    public List<ScheduleResult> MatchingSchedules { get; set; } = [];
}

public class ScoreBreakdown
{
    public double Proximity { get; set; }
    public double PoolLength { get; set; }
    public double LaneCount { get; set; }
    public double ScheduleConvenience { get; set; }
}

public class ScheduleResult
{
    public int ScheduleId { get; set; }
    public required string SwimType { get; set; }
    public int DayOfWeek { get; set; }
    public string StartTime { get; set; } = "";
    public string EndTime { get; set; } = "";
}
