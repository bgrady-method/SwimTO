import { cn } from '@/lib/utils';

interface MatchScoreBarProps {
  score: number;
  className?: string;
}

export function MatchScoreBar({ score, className }: MatchScoreBarProps) {
  const pct = Math.round(score * 100);
  const getColor = () => {
    if (pct >= 75) return 'from-emerald-400 to-emerald-500';
    if (pct >= 50) return 'from-sky-400 to-sky-500';
    if (pct >= 25) return 'from-amber-400 to-amber-500';
    return 'from-red-400 to-red-500';
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', getColor())}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono font-medium text-muted-foreground w-8 text-right">
        {pct}%
      </span>
    </div>
  );
}
