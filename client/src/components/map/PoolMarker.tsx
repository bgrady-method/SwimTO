import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { ExternalLink } from 'lucide-react';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { useMapStore } from '@/stores/useMapStore';
import { formatDistance } from '@/lib/geo-utils';
import { DAY_NAMES } from '@/types/pool';
import type { PoolSearchResult } from '@/types/pool';

interface PoolMarkerProps {
  result: PoolSearchResult;
}

function createPoolIcon(score: number, isHovered: boolean, isSelected: boolean): L.DivIcon {
  const size = isHovered || isSelected ? 32 : 24;
  const pct = Math.round(score * 100);
  const hue = Math.round(score * 120); // 0=red, 60=yellow, 120=green
  const borderColor = isSelected ? '#0ea5e9' : isHovered ? '#0c4a6e' : `hsl(${hue}, 70%, 45%)`;
  const bgColor = `hsl(${hue}, 70%, ${isHovered || isSelected ? '50%' : '55%'})`;

  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `
      <div style="
        width: ${size}px; height: ${size}px;
        border-radius: 50%;
        background: ${bgColor};
        border: 2.5px solid ${borderColor};
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: ${size > 28 ? 10 : 8}px; font-weight: 700;
        font-family: ui-monospace, monospace;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        transition: all 0.2s ease;
        ${isHovered || isSelected ? 'transform: scale(1.15); z-index: 1000;' : ''}
      ">${pct}</div>
    `,
  });
}

export function PoolMarker({ result }: PoolMarkerProps) {
  const hoveredPoolId = useMapStore((s) => s.hoveredPoolId);
  const selectedPoolId = useMapStore((s) => s.selectedPoolId);
  const setSelectedPool = useMapStore((s) => s.setSelectedPool);

  const isHovered = hoveredPoolId === result.poolId;
  const isSelected = selectedPoolId === result.poolId;
  const icon = createPoolIcon(result.compositeScore, isHovered, isSelected);

  return (
    <Marker
      position={[result.latitude, result.longitude]}
      icon={icon}
      zIndexOffset={isHovered || isSelected ? 1000 : 0}
      eventHandlers={{
        click: () => setSelectedPool(result.poolId),
      }}
    >
      <Popup className="pool-popup" maxWidth={280}>
        <div className="p-1">
          {result.imageUrl && (
            <img
              src={result.imageUrl}
              alt={result.name}
              className="max-h-24 w-full object-cover rounded mb-2"
            />
          )}
          <div className="flex items-start justify-between gap-1 mb-1">
            <h3 className="font-semibold text-sm">{result.name}</h3>
            <FavoriteButton poolId={result.poolId} size={14} />
          </div>
          <p className="text-xs text-gray-500 mb-2">
            {result.poolType} · {formatDistance(result.distanceKm)}
            {result.lengthMeters && <> · {result.lengthMeters}m</>}
            {result.laneCount && <> · {result.laneCount} lanes</>}
          </p>
          {result.matchingSchedules.length > 0 && (
            <div className="space-y-0.5">
              <p className="text-xs font-medium mb-1">Next sessions:</p>
              {result.matchingSchedules.slice(0, 3).map((s, i) => (
                <p key={i} className="text-xs text-gray-600">
                  {DAY_NAMES[s.dayOfWeek]} {s.startTime}–{s.endTime} ({s.swimType})
                </p>
              ))}
            </div>
          )}
          {result.website && (
            <a
              href={result.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 mt-2"
            >
              <ExternalLink className="h-3 w-3" />
              City of Toronto page
            </a>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
