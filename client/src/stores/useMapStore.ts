import { create } from 'zustand';
import { TORONTO_CENTER, DEFAULT_ZOOM } from '@/types/map';
import type { PoolReference } from '@/types/chat';

interface MapState {
  center: [number, number];
  zoom: number;
  selectedPoolId: number | null;
  hoveredPoolId: number | null;
  highlightedPools: PoolReference[];
  userLocation: [number, number] | null;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setSelectedPool: (id: number | null) => void;
  setHoveredPool: (id: number | null) => void;
  setHighlightedPools: (pools: PoolReference[]) => void;
  setUserLocation: (loc: [number, number] | null) => void;
  flyTo: (lat: number, lng: number, zoom?: number) => void;
}

export const useMapStore = create<MapState>((set) => ({
  center: TORONTO_CENTER,
  zoom: DEFAULT_ZOOM,
  selectedPoolId: null,
  hoveredPoolId: null,
  highlightedPools: [],
  userLocation: null,
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setSelectedPool: (id) => set({ selectedPoolId: id }),
  setHoveredPool: (id) => set({ hoveredPoolId: id }),
  setHighlightedPools: (pools) => set({ highlightedPools: pools }),
  setUserLocation: (loc) => set({ userLocation: loc }),
  flyTo: (lat, lng, zoom) => set({ center: [lat, lng], zoom: zoom ?? 14 }),
}));
