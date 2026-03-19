const SUGGESTIONS = [
  'Lane swim near me this Saturday morning',
  'Indoor 50m pools in Toronto',
  'Family swim times on weekends',
  'Aquafit classes near downtown',
  'Women-only swim sessions',
  'Pools open after 8pm tonight',
];

interface SuggestedQueriesProps {
  onSelect: (query: string) => void;
}

export function SuggestedQueries({ onSelect }: SuggestedQueriesProps) {
  return (
    <div className="flex flex-wrap gap-2 px-4 py-3">
      {SUGGESTIONS.map((query) => (
        <button
          key={query}
          onClick={() => onSelect(query)}
          className="text-sm px-4 py-2.5 min-h-[44px] rounded-full border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 active:bg-sky-200 transition-colors dark:bg-sky-950 dark:border-sky-800 dark:text-sky-300 dark:hover:bg-sky-900 dark:active:bg-sky-800"
        >
          {query}
        </button>
      ))}
    </div>
  );
}
