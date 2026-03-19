import { useEffect } from 'react';
import { useMapStore } from '@/stores/useMapStore';
import { useFilterStore } from '@/stores/useFilterStore';

export function useUserLocation() {
  const setUserLocation = useMapStore((s) => s.setUserLocation);
  const setLocation = useFilterStore((s) => s.setLocation);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(loc);
        setLocation({ lat: loc[0], lng: loc[1], radiusKm: 5 });
      },
      () => {
        // Default to Toronto City Hall
        setUserLocation([43.6532, -79.3832]);
      }
    );
  }, [setUserLocation, setLocation]);
}
