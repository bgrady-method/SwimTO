export interface Pool {
  poolId: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  poolType: 'Indoor' | 'Outdoor';
  lengthMeters: number | null;
  laneCount: number | null;
  isAccessible: boolean;
  phone: string | null;
  website: string | null;
}

export interface ScheduleResult {
  scheduleId: number;
  swimType: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface ScoreBreakdown {
  proximity: number;
  poolLength: number;
  laneCount: number;
  scheduleConvenience: number;
}

export interface PoolSearchResult extends Pool {
  distanceKm: number;
  compositeScore: number;
  scores: ScoreBreakdown;
  matchingSchedules: ScheduleResult[];
}

export const SWIM_TYPES = [
  'Lane Swim',
  'Leisure Swim',
  'Aquafit',
  'Women Only',
  'Older Adult',
  'Family',
] as const;

export type SwimType = (typeof SWIM_TYPES)[number];

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
