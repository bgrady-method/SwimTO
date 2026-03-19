import { Circle } from 'react-leaflet';
import { useFilterStore } from '@/stores/useFilterStore';

export function ProximityCircle() {
  const location = useFilterStore((s) => s.location);

  if (!location) return null;

  return (
    <Circle
      center={[location.lat, location.lng]}
      radius={location.radiusKm * 1000}
      pathOptions={{
        color: '#0ea5e9',
        fillColor: '#0ea5e9',
        fillOpacity: 0.05,
        weight: 2,
        dashArray: '8 4',
      }}
    />
  );
}
