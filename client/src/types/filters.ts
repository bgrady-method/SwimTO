export interface LocationFilter {
  lat: number;
  lng: number;
  radiusKm: number;
}

export interface AttributeFilter {
  poolType: string | null;
  minLength?: number | null;
  minLanes: number | null;
}

export interface RankingWeights {
  proximity: number;
  poolLength: number;
  laneCount: number;
  scheduleConvenience: number;
}

export interface PoolSearchRequest {
  swimTypes?: string[];
  dateFrom?: string;
  dateTo?: string;
  timeFrom?: string;
  timeTo?: string;
  daysOfWeek?: number[];
  location?: LocationFilter;
  attributes?: AttributeFilter;
  ranking?: RankingWeights;
  includeFacets?: boolean;
}
