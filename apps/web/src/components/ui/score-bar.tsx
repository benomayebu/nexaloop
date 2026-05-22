function scoreColor(value: number): string {
  if (value >= 85) return 'bg-emerald-500';
  if (value >= 65) return 'bg-amber-500';
  return 'bg-red-500';
}

interface ScoreBarProps {
  value: number;
  showNum?: boolean;
}

export function ScoreBar({ value, showNum = true }: ScoreBarProps) {
  const fill = Math.max(2, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden min-w-[60px]">
        <div
          className={`h-full rounded-full transition-all ${scoreColor(value)}`}
          style={{ width: `${fill}%` }}
        />
      </div>
      {showNum && <span className="text-xs font-medium text-slate-600 tabular-nums w-8 text-right">{value}%</span>}
    </div>
  );
}
