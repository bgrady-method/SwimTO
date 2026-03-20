namespace Api.Models.Dto;

public class PoolSearchRequest
{
    public string[]? SwimTypes { get; set; }
    public DateOnly? DateFrom { get; set; }
    public DateOnly? DateTo { get; set; }
    public TimeOnly? TimeFrom { get; set; }
    public TimeOnly? TimeTo { get; set; }
    public int[]? DaysOfWeek { get; set; }
    public LocationFilter? Location { get; set; }
    public AttributeFilter? Attributes { get; set; }
    public RankingWeights? Ranking { get; set; }
    public bool IncludeFacets { get; set; }
}

public class LocationFilter
{
    public double Lat { get; set; }
    public double Lng { get; set; }
    public double RadiusKm { get; set; } = 5.0;
}

public class AttributeFilter
{
    public string? PoolType { get; set; }
    public double? MinLength { get; set; }
    public int? MinLanes { get; set; }
    public string[]? Amenities { get; set; }
}

public class RankingWeights
{
    public double Proximity { get; set; } = 0.4;
    public double PoolLength { get; set; } = 0.2;
    public double LaneCount { get; set; } = 0.1;
    public double ScheduleConvenience { get; set; } = 0.3;
}
