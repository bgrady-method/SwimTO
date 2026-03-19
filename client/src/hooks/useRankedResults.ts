import { useMemo } from 'react';
import { reRankResults } from '@/lib/ranking';
import { useWeightStore } from '@/stores/useWeightStore';
import type { PoolSearchResult } from '@/types/pool';

export function useRankedResults(results: PoolSearchResult[] | undefined) {
  const { weights } = useWeightStore();

  return useMemo(() => {
    if (!results) return [];
    return reRankResults(results, weights);
  }, [results, weights]);
}
