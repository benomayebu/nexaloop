'use client';

import { useEffect, useState } from 'react';

interface DashStatCardProps {
  label: string;
  value: number;
  suffix?: string;
  sub: string;
  subTone?: 'emerald' | 'amber' | 'red' | 'slate';
  icon: React.ReactNode;
  accentFrom: string;
  accentTo: string;
  trend?: 'up' | 'down' | 'flat';
}

export function DashStatCard({
  label, value, suffix, sub, subTone = 'slate', icon, accentFrom, accentTo, trend,
}: DashStatCardProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (value === 0) { setCount(0); return; }
    const duration = 800;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value]);

  const subColors: Record<string, string> = {
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
    slate: 'text-slate-500',
  };

  const trendIcon = trend === 'up' ? (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  ) : trend === 'down' ? (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
    </svg>
  ) : null;

  return (
    <div className="animate-dash-card group relative overflow-hidden bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default">
      {/* Gradient accent stripe at top */}
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${accentFrom}, ${accentTo})` }}
      />

      {/* Decorative gradient orb */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-500 blur-xl"
        style={{ background: `radial-gradient(circle, ${accentFrom}, transparent)` }}
      />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: `linear-gradient(135deg, ${accentFrom}18, ${accentTo}18)` }}
          >
            <div style={{ color: accentFrom }}>{icon}</div>
          </div>
          {trendIcon && (
            <div className={`flex items-center gap-0.5 ${subColors[subTone]} rounded-full px-1.5 py-0.5 text-[10px] font-semibold`}
              style={{ backgroundColor: `${subTone === 'emerald' ? '#10b981' : subTone === 'amber' ? '#f59e0b' : subTone === 'red' ? '#ef4444' : '#94a3b8'}10` }}
            >
              {trendIcon}
            </div>
          )}
        </div>

        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-[28px] font-extrabold text-slate-900 tabular-nums leading-none">
          {count}{suffix && <span className="text-lg font-bold text-slate-400 ml-0.5">{suffix}</span>}
        </p>
        <p className={`text-xs font-medium mt-2 ${subColors[subTone]}`}>{sub}</p>
      </div>
    </div>
  );
}
