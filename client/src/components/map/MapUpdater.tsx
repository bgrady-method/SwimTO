import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '@/stores/useMapStore';

export function MapUpdater() {
  const map = useMap();
  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);

  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [map, center, zoom]);

  return null;
}
