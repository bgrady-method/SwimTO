import { CircleMarker } from 'react-leaflet';
import { useMapStore } from '@/stores/useMapStore';

export function UserLocationMarker() {
  const userLocation = useMapStore((s) => s.userLocation);

  if (!userLocation) return null;

  return (
    <>
      {/* Outer pulse ring */}
      <CircleMarker
        center={userLocation}
        radius={12}
        pathOptions={{
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.15,
          weight: 1,
        }}
      />
      {/* Inner dot */}
      <CircleMarker
        center={userLocation}
        radius={5}
        pathOptions={{
          color: '#ffffff',
          fillColor: '#3b82f6',
          fillOpacity: 1,
          weight: 2,
        }}
      />
    </>
  );
}
