import { MapPin, Ruler, Rows3, Accessibility, Droplets, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MatchScoreBar } from './MatchScoreBar';
import { useMapStore } from '@/stores/useMapStore';
import { formatDistance } from '@/lib/geo-utils';
import { cn } from '@/lib/utils';
import { DAY_NAMES } from '@/types/pool';
import type { PoolSearchResult } from '@/types/pool';

interface PoolTimeslotCardProps {
  result: PoolSearchResult;
  compact?: boolean;
}

const SWIM_TYPE_COLORS: Record<string, string> = {
  'Lane Swim': 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
  'Leisure Swim': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  'Aquafit': 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
  'Women Only': 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  'Older Adult': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  'Family': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
};

export function PoolTimeslotCard({ result, compact }: PoolTimeslotCardProps) {
  const setHoveredPool = useMapStore((s) => s.setHoveredPool);
  const flyTo = useMapStore((s) => s.flyTo);
  const setSelectedPool = useMapStore((s) => s.setSelectedPool);

  const uniqueSwimTypes = [...new Set(result.matchingSchedules.map((s) => s.swimType))];

  return (
    <Card
      className={cn(
        'p-3 hover:shadow-md transition-all cursor-pointer border-border',
        compact ? 'p-2.5' : 'p-3'
      )}
      onMouseEnter={() => setHoveredPool(result.poolId)}
      onMouseLeave={() => setHoveredPool(null)}
      onClick={() => {
        flyTo(result.latitude, result.longitude, 15);
        setSelectedPool(result.poolId);
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h3 className={cn('font-semibold text-foreground truncate', compact ? 'text-sm' : 'text-sm')}>
            {result.name}
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="font-mono">{formatDistance(result.distanceKm)}</span>
          </div>
        </div>
        <Badge variant="outline" className="text-xs shrink-0">
          {result.poolType}
        </Badge>
      </div>

      {/* Swim type badges */}
      <div className="flex flex-wrap gap-1 mb-2">
        {uniqueSwimTypes.map((type) => (
          <span
            key={type}
            className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded',
              SWIM_TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-700'
            )}
          >
            {type}
          </span>
        ))}
      </div>

      {/* Schedule preview */}
      {!compact && result.matchingSchedules.length > 0 && (
        <div className="space-y-1 mb-2">
          {result.matchingSchedules.slice(0, 3).map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0" />
              <span className="font-medium">{DAY_NAMES[s.dayOfWeek]}</span>
              <span className="font-mono">{s.startTime}–{s.endTime}</span>
              <span className="text-[10px]">{s.swimType}</span>
            </div>
          ))}
          {result.matchingSchedules.length > 3 && (
            <span className="text-[10px] text-muted-foreground">
              +{result.matchingSchedules.length - 3} more sessions
            </span>
          )}
        </div>
      )}

      {/* Attributes */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
        {result.lengthMeters && (
          <span className="flex items-center gap-1">
            <Ruler className="h-3 w-3" />
            {result.lengthMeters}m
          </span>
        )}
        {result.laneCount && (
          <span className="flex items-center gap-1">
            <Rows3 className="h-3 w-3" />
            {result.laneCount} lanes
          </span>
        )}
        {result.isAccessible && (
          <span className="flex items-center gap-1">
            <Accessibility className="h-3 w-3" />
          </span>
        )}
        <span className="flex items-center gap-1">
          <Droplets className="h-3 w-3" />
          {result.matchingSchedules.length} sessions
        </span>
      </div>

      {/* Score bar */}
      <MatchScoreBar score={result.compositeScore} />
    </Card>
  );
}
