import type { RankingWeights } from '@/types/filters';
import type { PoolSearchResult, ScoreBreakdown } from '@/types/pool';

export function reRankResults(
  results: PoolSearchResult[],
  weights: RankingWeights
): PoolSearchResult[] {
  return results
    .map((r) => ({
      ...r,
      compositeScore: calculateCompositeScore(r.scores, weights),
    }))
    .sort((a, b) => b.compositeScore - a.compositeScore);
}

export function calculateCompositeScore(
  scores: ScoreBreakdown,
  weights: RankingWeights
): number {
  const totalWeight =
    weights.proximity + weights.poolLength + weights.laneCount + weights.scheduleConvenience;
  if (totalWeight === 0) return 0;

  return (
    (scores.proximity * weights.proximity +
      scores.poolLength * weights.poolLength +
      scores.laneCount * weights.laneCount +
      scores.scheduleConvenience * weights.scheduleConvenience) /
    totalWeight
  );
}
