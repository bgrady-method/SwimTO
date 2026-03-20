import { useQuery } from '@tanstack/react-query';
import { searchPools } from '@/lib/api';
import { useFilterStore } from '@/stores/useFilterStore';
import { useWeightStore } from '@/stores/useWeightStore';
import type { PoolSearchRequest } from '@/types/filters';

export function usePoolSearch() {
  const { swimTypes, daysOfWeek, amenities, timeFrom, timeTo, location, attributes } = useFilterStore();
  const { weights } = useWeightStore();

  const request: PoolSearchRequest = {
    swimTypes: swimTypes.length > 0 ? swimTypes : undefined,
    daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : undefined,
    timeFrom: timeFrom !== '06:00' ? timeFrom : undefined,
    timeTo: timeTo !== '22:00' ? timeTo : undefined,
    location: location ?? undefined,
    attributes: {
      poolType: attributes.poolType,
      minLanes: attributes.minLanes,
      amenities: amenities.length > 0 ? amenities : undefined,
    },
    ranking: weights,
    includeFacets: true,
  };

  const query = useQuery({
    queryKey: ['poolSearch', request],
    queryFn: () => searchPools(request),
    staleTime: 30_000,
  });

  return {
    ...query,
    results: query.data?.results ?? [],
    facets: query.data?.facets ?? null,
  };
}
