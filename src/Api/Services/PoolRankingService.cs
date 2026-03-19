using Api.Models.Dto;

namespace Api.Services;

public class PoolRankingService
{
    public double CalculateCompositeScore(ScoreBreakdown scores, RankingWeights weights)
    {
        var totalWeight = weights.Proximity + weights.PoolLength + weights.LaneCount + weights.ScheduleConvenience;
        if (totalWeight == 0) return 0;

        return (scores.Proximity * weights.Proximity +
                scores.PoolLength * weights.PoolLength +
                scores.LaneCount * weights.LaneCount +
                scores.ScheduleConvenience * weights.ScheduleConvenience) / totalWeight;
    }

    public ScoreBreakdown CalculateScores(double distanceKm, double radiusKm, double? lengthMeters, int? laneCount, int matchingScheduleCount)
    {
        return new ScoreBreakdown
        {
            Proximity = NormalizeProximity(distanceKm, radiusKm),
            PoolLength = NormalizePoolLength(lengthMeters),
            LaneCount = NormalizeLaneCount(laneCount),
            ScheduleConvenience = NormalizeScheduleConvenience(matchingScheduleCount),
        };
    }

    // 1 = closest (0 km), 0 = at radius edge
    private static double NormalizeProximity(double distanceKm, double radiusKm)
        => Math.Max(0, 1 - distanceKm / radiusKm);

    // 50m = 1.0, 25m = 0.5
    private static double NormalizePoolLength(double? lengthMeters)
        => lengthMeters.HasValue ? Math.Min(lengthMeters.Value / 50.0, 1.0) : 0.25;

    // 8+ lanes = 1.0
    private static double NormalizeLaneCount(int? laneCount)
        => laneCount.HasValue ? Math.Min(laneCount.Value / 8.0, 1.0) : 0.25;

    // 5+ matching slots = 1.0
    private static double NormalizeScheduleConvenience(int matchingScheduleCount)
        => Math.Min(matchingScheduleCount / 5.0, 1.0);
}
