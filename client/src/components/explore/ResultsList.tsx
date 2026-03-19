import { PoolTimeslotCard } from '@/components/results/PoolTimeslotCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import type { PoolSearchResult } from '@/types/pool';

interface ResultsListProps {
  results: PoolSearchResult[];
  isLoading: boolean;
}

export function ResultsList({ results, isLoading }: ResultsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <Search className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium text-foreground">No pools found</p>
        <p className="text-xs text-muted-foreground mt-1">
          Try adjusting your filters or expanding the search radius
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3">
      <div className="text-xs text-muted-foreground mb-1">
        {results.length} pool{results.length !== 1 ? 's' : ''} found
      </div>
      {results.map((result) => (
        <PoolTimeslotCard key={result.poolId} result={result} />
      ))}
    </div>
  );
}
