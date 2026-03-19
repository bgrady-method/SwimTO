import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '@/stores/useMapStore';

export function MapUpdater() {
  const map = useMap();
  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);

  useEffect(() => {
    // Skip if coordinates are invalid or map container has zero dimensions
    // (e.g. desktop MapPanel is CSS-hidden on mobile)
    if (!Number.isFinite(center[0]) || !Number.isFinite(center[1])) return;
    const size = map.getSize();
    if (size.x === 0 && size.y === 0) return;
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [map, center, zoom]);

  return null;
}
