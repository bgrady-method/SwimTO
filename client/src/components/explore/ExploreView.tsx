import { FilterPanel } from './FilterPanel';
import { WeightingPanel } from './WeightingPanel';
import { ResultsList } from './ResultsList';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { PoolSearchResult } from '@/types/pool';

interface ExploreViewProps {
  results: PoolSearchResult[];
  isLoading: boolean;
}

export function ExploreView({ results, isLoading }: ExploreViewProps) {
  return (
    <ScrollArea className="h-full">
      <FilterPanel />
      <Separator />
      <WeightingPanel />
      <Separator />
      <ResultsList results={results} isLoading={isLoading} />
    </ScrollArea>
  );
}
