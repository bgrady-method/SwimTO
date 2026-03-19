using Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Api.Services.DataSync;

public class PoolDataSyncBackgroundService(
    IServiceProvider serviceProvider,
    IConfiguration configuration,
    ILogger<PoolDataSyncBackgroundService> logger) : BackgroundService
{
    private int _consecutiveFailures;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var enabled = configuration.GetValue("DataSync:Enabled", true);
        if (!enabled)
        {
            logger.LogInformation("Data sync is disabled via configuration");
            return;
        }

        var initialDelay = TimeSpan.FromSeconds(configuration.GetValue("DataSync:InitialDelaySeconds", 10));
        var intervalHours = configuration.GetValue("DataSync:IntervalHours", 6);

        logger.LogInformation("Data sync service starting, initial delay: {Delay}s, interval: {Hours}h",
            initialDelay.TotalSeconds, intervalHours);

        await Task.Delay(initialDelay, stoppingToken);

        // Initial sync
        await RunSyncWithFallbackAsync(stoppingToken);

        // Periodic sync
        using var timer = new PeriodicTimer(TimeSpan.FromHours(GetCurrentInterval(intervalHours)));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await RunSyncWithFallbackAsync(stoppingToken);
        }
    }

    private double GetCurrentInterval(int baseIntervalHours)
    {
        // After 3 consecutive failures, back off to double the interval
        return _consecutiveFailures >= 3 ? baseIntervalHours * 2 : baseIntervalHours;
    }

    private async Task RunSyncWithFallbackAsync(CancellationToken ct)
    {
        try
        {
            await using var scope = serviceProvider.CreateAsyncScope();
            var syncService = scope.ServiceProvider.GetRequiredService<PoolDataSyncService>();
            var syncLog = await syncService.RunFullSyncAsync(ct);

            _consecutiveFailures = 0;
            logger.LogInformation(
                "Data sync succeeded: {Added} added, {Updated} updated, {Schedules} schedules",
                syncLog.PoolsAdded, syncLog.PoolsUpdated, syncLog.SchedulesReplaced);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // Shutting down, don't fallback
            return;
        }
        catch (Exception ex)
        {
            _consecutiveFailures++;
            logger.LogError(ex, "Data sync failed (consecutive failures: {Count})", _consecutiveFailures);

            // If DB is empty, fall back to seed data
            try
            {
                await using var scope = serviceProvider.CreateAsyncScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                if (!await db.Pools.AnyAsync(ct))
                {
                    logger.LogWarning("Database is empty after sync failure, falling back to seed data");
                    await SeedData.SeedAsync(db);
                }
            }
            catch (Exception fallbackEx)
            {
                logger.LogError(fallbackEx, "Seed data fallback also failed");
            }
        }
    }
}
