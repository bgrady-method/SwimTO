import { ExternalLink, MapPin, Rows3, Waves } from 'lucide-react';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { useMapStore } from '@/stores/useMapStore';
import { formatDistance } from '@/lib/geo-utils';
import { cn } from '@/lib/utils';
import type { PoolReference } from '@/types/chat';

interface ResultsCarouselProps {
  pools: PoolReference[];
}

// Color based on pool type
function getPoolGradient(poolType?: string, poolId?: number): string {
  if (poolType === 'Outdoor') return 'from-emerald-400 to-cyan-500';
  const gradients = [
    'from-sky-400 to-blue-600',
    'from-cyan-400 to-sky-600',
    'from-blue-400 to-indigo-500',
    'from-sky-500 to-cyan-600',
  ];
  return gradients[(poolId ?? 0) % gradients.length];
}

export function ResultsCarousel({ pools }: ResultsCarouselProps) {
  const flyTo = useMapStore((s) => s.flyTo);
  const setSelectedPool = useMapStore((s) => s.setSelectedPool);
  const setRequestMapView = useMapStore((s) => s.setRequestMapView);

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1">
      {pools.map((pool) => (
        <button
          key={pool.poolId}
          onClick={() => {
            flyTo(pool.lat, pool.lng, 15);
            setSelectedPool(pool.poolId);
            setRequestMapView(true);
          }}
          className="group flex flex-col w-[200px] shrink-0 rounded-xl bg-background border border-border overflow-hidden hover:border-sky-300 hover:shadow-md transition-all text-left"
        >
          {/* Visual header with pool image or gradient fallback */}
          <div className={cn(
            'relative h-16 bg-gradient-to-br flex items-center justify-center overflow-hidden',
            getPoolGradient(pool.poolType, pool.poolId)
          )}>
            {pool.imageUrl ? (
              <img src={pool.imageUrl} alt={pool.name} className="h-16 w-full object-cover" />
            ) : (
              <Waves className="h-8 w-8 text-white/40" />
            )}
            <div className="absolute top-1.5 right-1.5">
              <FavoriteButton poolId={pool.poolId} size={14} className="text-white hover:bg-white/20" />
            </div>
            <div className="absolute top-1.5 left-1.5 flex gap-1">
              {pool.poolType && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/20 text-white backdrop-blur-sm">
                  {pool.poolType}
                </span>
              )}
              {pool.lengthMeters && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/20 text-white backdrop-blur-sm">
                  {pool.lengthMeters}m
                </span>
              )}
            </div>
            {pool.distanceKm != null && (
              <span className="absolute bottom-1.5 right-1.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/30 text-white backdrop-blur-sm">
                {formatDistance(pool.distanceKm)}
              </span>
            )}
          </div>

          {/* Pool info */}
          <div className="p-2.5 space-y-1">
            <h4 className="text-xs font-semibold text-foreground leading-tight line-clamp-2">
              {pool.name}
            </h4>

            {pool.address && (
              <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                <MapPin className="h-2.5 w-2.5 shrink-0" />
                {pool.address}
              </p>
            )}

            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              {pool.laneCount && (
                <span className="flex items-center gap-0.5">
                  <Rows3 className="h-2.5 w-2.5" />
                  {pool.laneCount} lanes
                </span>
              )}
            </div>

            {pool.website && (
              <a
                href={pool.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-0.5 text-[10px] text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
              >
                <ExternalLink className="h-2.5 w-2.5" />
                City of Toronto page
              </a>
            )}
            <div className="text-[10px] text-sky-600 font-medium pt-0.5">
              Show on map →
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
