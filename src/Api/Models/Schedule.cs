namespace Api.Models;

public class Schedule
{
    public int Id { get; set; }
    public int PoolId { get; set; }
    public required string SwimType { get; set; }
    public int DayOfWeek { get; set; } // 0=Sun..6=Sat
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }

    public Pool Pool { get; set; } = null!;
}
