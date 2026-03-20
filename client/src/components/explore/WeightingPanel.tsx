import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useWeightStore, PRESETS, type WeightPreset } from '@/stores/useWeightStore';
import { cn } from '@/lib/utils';

const WEIGHT_CONFIG = [
  { key: 'proximity' as const, label: 'Proximity', color: 'bg-emerald-500' },
  { key: 'laneCount' as const, label: 'Lane Count', color: 'bg-violet-500' },
  { key: 'scheduleConvenience' as const, label: 'Schedule Fit', color: 'bg-amber-500' },
];

const PRESET_LABELS: Record<WeightPreset, string> = {
  closest: 'Closest',
  bestPool: 'Best Pool',
  mostConvenient: 'Most Convenient',
  balanced: 'Balanced',
};

export function WeightingPanel() {
  const { weights, setWeight, applyPreset } = useWeightStore();

  // Detect which preset is active
  const activePreset = (Object.entries(PRESETS) as [WeightPreset, typeof weights][]).find(
    ([, w]) =>
      Math.abs(w.proximity - weights.proximity) < 0.01 &&
      Math.abs(w.poolLength - weights.poolLength) < 0.01 &&
      Math.abs(w.laneCount - weights.laneCount) < 0.01 &&
      Math.abs(w.scheduleConvenience - weights.scheduleConvenience) < 0.01
  )?.[0];

  return (
    <div className="px-3 py-2 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Ranking</h3>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(PRESETS) as WeightPreset[]).map((preset) => (
          <Button
            key={preset}
            size="sm"
            variant={activePreset === preset ? 'default' : 'outline'}
            onClick={() => applyPreset(preset)}
            className={cn('h-9 text-xs', activePreset === preset && 'bg-sky-500 hover:bg-sky-600')}
          >
            {PRESET_LABELS[preset]}
          </Button>
        ))}
      </div>

      {/* Weight sliders */}
      <div className="space-y-3">
        {WEIGHT_CONFIG.map(({ key, label, color }) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span className={cn('h-2 w-2 rounded-full', color)} />
                <span className="text-muted-foreground">{label}</span>
              </span>
              <span className="font-mono text-muted-foreground">
                {Math.round(weights[key] * 100)}%
              </span>
            </div>
            <Slider
              value={[weights[key] * 100]}
              onValueChange={(val) => { const v = Array.isArray(val) ? val[0] : val; setWeight(key, v / 100); }}
              min={0}
              max={100}
              step={5}
              className="py-0.5"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
