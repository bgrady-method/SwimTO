using Api.Data;
using Api.Models.Dto;
using Api.Services;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints;

public static class PoolEndpoints
{
    public static void MapPoolEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/pools");

        group.MapPost("/search", async (PoolSearchRequest request, PoolSearchService searchService) =>
        {
            var response = await searchService.SearchAsync(request);
            return Results.Ok(response);
        });

        group.MapGet("/{id:int}", async (int id, AppDbContext db) =>
        {
            var pool = await db.Pools
                .Include(p => p.Schedules)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pool is null) return Results.NotFound();

            return Results.Ok(new
            {
                pool.Id,
                pool.Name,
                pool.Address,
                pool.Latitude,
                pool.Longitude,
                pool.PoolType,
                pool.LengthMeters,
                pool.LaneCount,
                pool.IsAccessible,
                pool.Phone,
                pool.Website,
                pool.ImageUrl,
            });
        });

        group.MapGet("/{id:int}/schedule", async (int id, string? swimType, AppDbContext db) =>
        {
            var query = db.Schedules.Where(s => s.PoolId == id);

            if (!string.IsNullOrEmpty(swimType))
                query = query.Where(s => s.SwimType == swimType);

            var schedules = await query.OrderBy(s => s.DayOfWeek).ThenBy(s => s.StartTime).ToListAsync();

            return Results.Ok(schedules.Select(s => new ScheduleResult
            {
                ScheduleId = s.Id,
                SwimType = s.SwimType,
                DayOfWeek = s.DayOfWeek,
                StartTime = s.StartTime.ToString("HH:mm"),
                EndTime = s.EndTime.ToString("HH:mm"),
            }));
        });

        app.MapGet("/api/swim-types", async (AppDbContext db) =>
        {
            var types = await db.Schedules.Select(s => s.SwimType).Distinct().OrderBy(t => t).ToListAsync();
            return Results.Ok(types);
        });
    }
}
