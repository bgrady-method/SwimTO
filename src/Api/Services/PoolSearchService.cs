using Api.Data;
using Api.Models.Dto;
using Microsoft.EntityFrameworkCore;

namespace Api.Services;

public class PoolSearchService(AppDbContext db, PoolRankingService rankingService)
{
    // Default center: Toronto City Hall
    private const double DefaultLat = 43.6532;
    private const double DefaultLng = -79.3832;
    private const double DefaultRadiusKm = 10.0;

    public async Task<List<PoolSearchResult>> SearchAsync(PoolSearchRequest request)
    {
        var lat = request.Location?.Lat ?? DefaultLat;
        var lng = request.Location?.Lng ?? DefaultLng;
        var radiusKm = request.Location?.RadiusKm ?? DefaultRadiusKm;
        var weights = request.Ranking ?? new RankingWeights();

        var query = db.Pools.Include(p => p.Schedules).Where(p => p.IsActive).AsQueryable();

        // Attribute filters
        if (request.Attributes?.PoolType is not null)
            query = query.Where(p => p.PoolType == request.Attributes.PoolType);
        if (request.Attributes?.MinLength is > 0)
            query = query.Where(p => p.LengthMeters >= request.Attributes.MinLength);
        if (request.Attributes?.MinLanes is > 0)
            query = query.Where(p => p.LaneCount >= request.Attributes.MinLanes);

        var pools = await query.ToListAsync();

        var results = new List<PoolSearchResult>();

        foreach (var pool in pools)
        {
            var distance = GeoUtils.HaversineDistance(lat, lng, pool.Latitude, pool.Longitude);
            if (distance > radiusKm) continue;

            // Filter schedules
            var matchingSchedules = pool.Schedules.AsEnumerable();

            if (request.SwimTypes is { Length: > 0 })
                matchingSchedules = matchingSchedules.Where(s => request.SwimTypes.Contains(s.SwimType));

            if (request.DaysOfWeek is { Length: > 0 })
                matchingSchedules = matchingSchedules.Where(s => request.DaysOfWeek.Contains(s.DayOfWeek));

            if (request.TimeFrom.HasValue)
                matchingSchedules = matchingSchedules.Where(s => s.StartTime >= request.TimeFrom.Value || s.EndTime >= request.TimeFrom.Value);

            if (request.TimeTo.HasValue)
                matchingSchedules = matchingSchedules.Where(s => s.StartTime <= request.TimeTo.Value);

            if (request.DateFrom.HasValue)
                matchingSchedules = matchingSchedules.Where(s => s.EffectiveTo == null || s.EffectiveTo >= request.DateFrom.Value);

            if (request.DateTo.HasValue)
                matchingSchedules = matchingSchedules.Where(s => s.EffectiveFrom <= request.DateTo.Value);

            var scheduleList = matchingSchedules.ToList();

            // If swim type or day filters are set, only include pools with matching schedules
            if ((request.SwimTypes is { Length: > 0 } || request.DaysOfWeek is { Length: > 0 }) && scheduleList.Count == 0)
                continue;

            var scores = rankingService.CalculateScores(
                distance, radiusKm, pool.LengthMeters, pool.LaneCount, scheduleList.Count);
            var compositeScore = rankingService.CalculateCompositeScore(scores, weights);

            results.Add(new PoolSearchResult
            {
                PoolId = pool.Id,
                Name = pool.Name,
                Address = pool.Address,
                Latitude = pool.Latitude,
                Longitude = pool.Longitude,
                PoolType = pool.PoolType,
                LengthMeters = pool.LengthMeters,
                LaneCount = pool.LaneCount,
                IsAccessible = pool.IsAccessible,
                Phone = pool.Phone,
                Website = pool.Website,
                DistanceKm = Math.Round(distance, 2),
                CompositeScore = Math.Round(compositeScore, 4),
                Scores = scores,
                MatchingSchedules = scheduleList.Select(s => new ScheduleResult
                {
                    ScheduleId = s.Id,
                    SwimType = s.SwimType,
                    DayOfWeek = s.DayOfWeek,
                    StartTime = s.StartTime.ToString("HH:mm"),
                    EndTime = s.EndTime.ToString("HH:mm"),
                }).ToList(),
            });
        }

        return results.OrderByDescending(r => r.CompositeScore).ToList();
    }
}
