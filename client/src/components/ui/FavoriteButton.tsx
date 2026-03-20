import { Heart } from 'lucide-react';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  poolId: number;
  className?: string;
  size?: number;
}

export function FavoriteButton({ poolId, className, size = 16 }: FavoriteButtonProps) {
  const isFavorite = useFavoritesStore((s) => s.isFavorite(poolId));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleFavorite(poolId);
      }}
      className={cn(
        'shrink-0 p-1 rounded-full transition-colors hover:bg-muted/50',
        className
      )}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={cn(
          'transition-colors',
          isFavorite ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground'
        )}
        style={{ width: size, height: size }}
      />
    </button>
  );
}
