import { Search, X } from 'lucide-react';
import { FilterPanel } from './FilterPanel';
import { WeightingPanel } from './WeightingPanel';
import { ResultsList } from './ResultsList';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useFilterStore } from '@/stores/useFilterStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import type { PoolSearchResult } from '@/types/pool';
import { useMemo } from 'react';

interface ExploreViewProps {
  results: PoolSearchResult[];
  isLoading: boolean;
}

export function ExploreView({ results, isLoading }: ExploreViewProps) {
  const searchQuery = useFilterStore((s) => s.searchQuery);
  const setSearchQuery = useFilterStore((s) => s.setSearchQuery);
  const showFavoritesOnly = useFilterStore((s) => s.showFavoritesOnly);
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);

  const filteredResults = useMemo(() => {
    let filtered = results;

    if (showFavoritesOnly) {
      filtered = filtered.filter((r) => favoriteIds.includes(r.poolId));
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.address.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [results, searchQuery, showFavoritesOnly, favoriteIds]);

  return (
    <ScrollArea className="h-full">
      {/* Search input */}
      <div className="px-3 pt-2 pb-1">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search pools by name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-8 pr-8 text-base lg:text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
      <FilterPanel />
      <Separator />
      <WeightingPanel />
      <Separator />
      <ResultsList results={filteredResults} isLoading={isLoading} />
    </ScrollArea>
  );
}
