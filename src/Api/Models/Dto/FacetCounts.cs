namespace Api.Models.Dto;

public class FacetCounts
{
    public Dictionary<string, int> SwimTypes { get; set; } = new();
    public Dictionary<int, int> DaysOfWeek { get; set; } = new();
    public Dictionary<string, int> PoolTypes { get; set; } = new();
}
