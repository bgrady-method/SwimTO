import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Heart, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useFilterStore } from '@/stores/useFilterStore';
import { usePoolSearch } from '@/hooks/usePoolSearch';
import { geocodeAddress, getSwimTypes } from '@/lib/api';
import { cn } from '@/lib/utils';
import { SWIM_TYPES, DAY_NAMES } from '@/types/pool';

export function FilterPanel() {
  const {
    swimTypes, daysOfWeek, timeFrom, timeTo, location, attributes,
    showFavoritesOnly,
    toggleSwimType, toggleDay, setTimeRange, setLocation, setAttributes,
    toggleShowFavoritesOnly, resetFilters,
  } = useFilterStore();

  const { facets } = usePoolSearch();

  const [locationInput, setLocationInput] = useState('');
  const [sections, setSections] = useState({ swimType: true, time: true, location: true, pool: false });

  const { data: dynamicSwimTypes } = useQuery({
    queryKey: ['swimTypes'],
    queryFn: getSwimTypes,
    staleTime: 5 * 60_000,
  });
  const swimTypeOptions = dynamicSwimTypes && dynamicSwimTypes.length > 0 ? dynamicSwimTypes : [...SWIM_TYPES];

  const toggleSection = (key: keyof typeof sections) =>
    setSections((s) => ({ ...s, [key]: !s[key] }));

  const handleGeocode = async () => {
    if (!locationInput.trim()) return;
    try {
      const result = await geocodeAddress(locationInput);
      setLocation({ lat: result.lat, lng: result.lng, radiusKm: location?.radiusKm ?? 5 });
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-1 px-3 py-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">Filters</h3>
        <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs">
          <RotateCcw className="h-3 w-3 mr-1" /> Reset
        </Button>
      </div>

      {/* Favorites only */}
      <button
        onClick={toggleShowFavoritesOnly}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2.5 min-h-[44px] rounded-lg border text-sm font-medium transition-colors active:opacity-80',
          showFavoritesOnly
            ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700'
            : 'bg-background border-border text-muted-foreground hover:border-rose-300'
        )}
      >
        <Heart className={cn('h-4 w-4', showFavoritesOnly ? 'fill-rose-500 text-rose-500' : '')} />
        Favorites only
      </button>

      {/* Swim Type */}
      <CollapsibleSection title="Swim Type" open={sections.swimType} onToggle={() => toggleSection('swimType')}>
        <div className="flex flex-wrap gap-1.5">
          {swimTypeOptions.map((type) => {
            const count = facets?.swimTypes[type];
            const isZero = count === 0;
            return (
              <button
                key={type}
                onClick={() => toggleSwimType(type)}
                className={cn(
                  'text-xs px-3 py-2 min-h-[36px] rounded-full border transition-colors active:opacity-80',
                  swimTypes.includes(type)
                    ? 'bg-sky-500 text-white border-sky-500'
                    : 'bg-background border-border text-muted-foreground hover:border-sky-300',
                  isZero && !swimTypes.includes(type) && 'opacity-40'
                )}
              >
                {type}
                {count != null && (
                  <span className="ml-1.5 opacity-75">({count})</span>
                )}
              </button>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* Day & Time */}
      <CollapsibleSection title="Day & Time" open={sections.time} onToggle={() => toggleSection('time')}>
        <div className="space-y-3">
          <div className="flex gap-1">
            {DAY_NAMES.map((day, i) => {
              const count = facets?.daysOfWeek[i];
              const isZero = count === 0;
              return (
                <button
                  key={day}
                  onClick={() => toggleDay(i)}
                  className={cn(
                    'flex-1 flex flex-col items-center justify-center text-xs py-1.5 min-h-[44px] rounded border transition-colors font-medium active:opacity-80',
                    daysOfWeek.includes(i)
                      ? 'bg-sky-500 text-white border-sky-500'
                      : 'bg-background border-border text-muted-foreground hover:border-sky-300',
                    isZero && !daysOfWeek.includes(i) && 'opacity-40'
                  )}
                >
                  <span>{day}</span>
                  {count != null && (
                    <span className="text-[10px] opacity-75 leading-tight">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={timeFrom}
              onChange={(e) => setTimeRange(e.target.value, timeTo)}
              className="h-9 text-base lg:text-xs"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="time"
              value={timeTo}
              onChange={(e) => setTimeRange(timeFrom, e.target.value)}
              className="h-9 text-base lg:text-xs"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Location */}
      <CollapsibleSection title="Location" open={sections.location} onToggle={() => toggleSection('location')}>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Address or intersection..."
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGeocode()}
              className="h-9 text-base lg:text-xs"
            />
            <Button size="sm" onClick={handleGeocode} className="h-9 text-xs shrink-0">Go</Button>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Radius</span>
              <span className="font-mono">{location?.radiusKm ?? 5} km</span>
            </div>
            <Slider
              value={[location?.radiusKm ?? 5]}
              onValueChange={(val) => {
                const v = Array.isArray(val) ? val[0] : val;
                if (location) setLocation({ ...location, radiusKm: v });
                else setLocation({ lat: 43.6532, lng: -79.3832, radiusKm: v });
              }}
              min={1}
              max={20}
              step={0.5}
              className="py-1"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Pool Attributes */}
      <CollapsibleSection title="Pool Attributes" open={sections.pool} onToggle={() => toggleSection('pool')}>
        <div className="space-y-3">
          <div className="flex gap-1.5">
            {['Indoor', 'Outdoor'].map((type) => {
              const count = facets?.poolTypes[type];
              const isZero = count === 0;
              return (
                <button
                  key={type}
                  onClick={() => setAttributes({ poolType: attributes.poolType === type ? null : type })}
                  className={cn(
                    'flex-1 text-xs py-2.5 min-h-[44px] rounded border transition-colors font-medium active:opacity-80',
                    attributes.poolType === type
                      ? 'bg-sky-500 text-white border-sky-500'
                      : 'bg-background border-border text-muted-foreground hover:border-sky-300',
                    isZero && attributes.poolType !== type && 'opacity-40'
                  )}
                >
                  {type}
                  {count != null && (
                    <span className="ml-1.5 opacity-75">({count})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}

function CollapsibleSection({ title, open, onToggle, children }: {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-3 min-h-[44px] text-sm font-medium text-foreground hover:bg-muted/50 active:bg-muted transition-colors"
      >
        {title}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}
