import { create } from 'zustand';
import type { RankingWeights } from '@/types/filters';

interface WeightState {
  weights: RankingWeights;
  setWeight: (key: keyof RankingWeights, value: number) => void;
  setWeights: (weights: RankingWeights) => void;
  applyPreset: (preset: WeightPreset) => void;
}

export type WeightPreset = 'closest' | 'bestPool' | 'mostConvenient' | 'balanced';

const PRESETS: Record<WeightPreset, RankingWeights> = {
  closest: { proximity: 0.8, poolLength: 0.05, laneCount: 0.05, scheduleConvenience: 0.1 },
  bestPool: { proximity: 0.1, poolLength: 0.4, laneCount: 0.3, scheduleConvenience: 0.2 },
  mostConvenient: { proximity: 0.2, poolLength: 0.05, laneCount: 0.05, scheduleConvenience: 0.7 },
  balanced: { proximity: 0.3, poolLength: 0.2, laneCount: 0.2, scheduleConvenience: 0.3 },
};

export const useWeightStore = create<WeightState>((set) => ({
  weights: PRESETS.balanced,
  setWeight: (key, value) =>
    set((s) => ({ weights: { ...s.weights, [key]: value } })),
  setWeights: (weights) => set({ weights }),
  applyPreset: (preset) => set({ weights: PRESETS[preset] }),
}));

export { PRESETS };
