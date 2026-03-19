namespace Api.Models;

public class DataSyncLog
{
    public int Id { get; set; }
    public required string SyncType { get; set; } // "Full"
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public required string Status { get; set; } // "Running" | "Success" | "Failed"
    public int PoolsAdded { get; set; }
    public int PoolsUpdated { get; set; }
    public int SchedulesReplaced { get; set; }
    public string? ErrorMessage { get; set; }
}
