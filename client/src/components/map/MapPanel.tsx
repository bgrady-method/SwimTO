import { useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { PoolMarker } from './PoolMarker';
import { ProximityCircle } from './ProximityCircle';
import { UserLocationMarker } from './UserLocationMarker';
import { MapLegend } from './MapLegend';
import { MapUpdater } from './MapUpdater';
import { TORONTO_CENTER, DEFAULT_ZOOM, TORONTO_BOUNDS } from '@/types/map';
import type { PoolSearchResult } from '@/types/pool';
import type { PoolReference } from '@/types/chat';
import 'leaflet/dist/leaflet.css';

interface MapPanelProps {
  results: PoolSearchResult[];
  activeTab: 'chat' | 'explore';
  highlightedPools: PoolReference[];
}

function toPoolSearchResult(ref: PoolReference): PoolSearchResult {
  return {
    poolId: ref.poolId,
    name: ref.name,
    address: ref.address ?? '',
    latitude: ref.lat,
    longitude: ref.lng,
    poolType: (ref.poolType as 'Indoor' | 'Outdoor') ?? 'Indoor',
    lengthMeters: ref.lengthMeters ?? null,
    laneCount: ref.laneCount ?? null,
    isAccessible: false,
    phone: null,
    website: ref.website ?? null,
    distanceKm: ref.distanceKm ?? 0,
    compositeScore: 0.85,
    scores: { proximity: 0, poolLength: 0, laneCount: 0, scheduleConvenience: 0 },
    matchingSchedules: [],
  };
}

export function MapPanel({ results, activeTab, highlightedPools }: MapPanelProps) {
  const markersToShow = useMemo(() => {
    if (activeTab === 'chat' && highlightedPools.length > 0) {
      return highlightedPools.map(toPoolSearchResult);
    }
    return results;
  }, [activeTab, highlightedPools, results]);

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={TORONTO_CENTER}
        zoom={DEFAULT_ZOOM}
        maxBounds={TORONTO_BOUNDS}
        minZoom={10}
        maxZoom={18}
        className="w-full h-full z-0"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater />
        <ProximityCircle />
        <UserLocationMarker />
        {markersToShow.map((result) => (
          <PoolMarker key={result.poolId} result={result} />
        ))}
      </MapContainer>
      <MapLegend />
    </div>
  );
}
