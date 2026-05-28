'use client';

const LABELS = ['Declaration setup', 'Product lines', 'Your estimate'];

interface ProgressBarProps {
  step: number;
  totalSteps?: number;
}

export function ProgressBar({ step, totalSteps = 3 }: ProgressBarProps) {
  const pct = (step / totalSteps) * 100;
  return (
    <div className="mt-3">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
          Step {step} of {totalSteps}
        </span>
        <span className="text-sm font-medium text-slate-700">{LABELS[step - 1]}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
