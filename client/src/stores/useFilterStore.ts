import { create } from 'zustand';
import type { LocationFilter, AttributeFilter } from '@/types/filters';

interface FilterState {
  swimTypes: string[];
  daysOfWeek: number[];
  amenities: string[];
  timeFrom: string;
  timeTo: string;
  location: LocationFilter | null;
  attributes: AttributeFilter;
  searchQuery: string;
  showFavoritesOnly: boolean;
  setSwimTypes: (types: string[]) => void;
  toggleSwimType: (type: string) => void;
  setDaysOfWeek: (days: number[]) => void;
  toggleDay: (day: number) => void;
  setAmenities: (amenities: string[]) => void;
  toggleAmenity: (amenity: string) => void;
  setTimeRange: (from: string, to: string) => void;
  setLocation: (location: LocationFilter | null) => void;
  setAttributes: (attrs: Partial<AttributeFilter>) => void;
  setSearchQuery: (query: string) => void;
  toggleShowFavoritesOnly: () => void;
  resetFilters: () => void;
}

const initialState = {
  swimTypes: [] as string[],
  daysOfWeek: [] as number[],
  amenities: [] as string[],
  timeFrom: '06:00',
  timeTo: '22:00',
  location: null as LocationFilter | null,
  attributes: { poolType: null, minLength: null, minLanes: null } as AttributeFilter,
  searchQuery: '',
  showFavoritesOnly: false,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,
  setSwimTypes: (types) => set({ swimTypes: types }),
  toggleSwimType: (type) =>
    set((s) => ({
      swimTypes: s.swimTypes.includes(type)
        ? s.swimTypes.filter((t) => t !== type)
        : [...s.swimTypes, type],
    })),
  setDaysOfWeek: (days) => set({ daysOfWeek: days }),
  toggleDay: (day) =>
    set((s) => ({
      daysOfWeek: s.daysOfWeek.includes(day)
        ? s.daysOfWeek.filter((d) => d !== day)
        : [...s.daysOfWeek, day],
    })),
  setAmenities: (amenities) => set({ amenities }),
  toggleAmenity: (amenity) =>
    set((s) => ({
      amenities: s.amenities.includes(amenity)
        ? s.amenities.filter((a) => a !== amenity)
        : [...s.amenities, amenity],
    })),
  setTimeRange: (from, to) => set({ timeFrom: from, timeTo: to }),
  setLocation: (location) => set({ location }),
  setAttributes: (attrs) =>
    set((s) => ({ attributes: { ...s.attributes, ...attrs } })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleShowFavoritesOnly: () =>
    set((s) => ({ showFavoritesOnly: !s.showFavoritesOnly })),
  resetFilters: () => set(initialState),
}));
