export function MapLegend() {
  return (
    <div className="absolute bottom-4 left-4 lg:left-auto lg:right-4 z-[1000] bg-background/90 backdrop-blur border border-border rounded-lg p-3 text-xs space-y-1.5 shadow-sm">
      <div className="font-medium text-foreground">Match Score</div>
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {[0, 25, 50, 75, 100].map((pct) => {
            const hue = Math.round((pct / 100) * 120);
            return (
              <div
                key={pct}
                className="h-3 w-5 rounded-sm"
                style={{ background: `hsl(${hue}, 70%, 55%)` }}
              />
            );
          })}
        </div>
        <span className="text-muted-foreground">0-100%</span>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <div className="h-2.5 w-2.5 rounded-full bg-blue-500 border-2 border-white" />
        Your location
      </div>
    </div>
  );
}
