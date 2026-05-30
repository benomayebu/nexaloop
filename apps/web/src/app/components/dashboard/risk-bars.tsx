'use client';

import { useState } from 'react';

interface RiskBarsProps {
  breakdown: Record<string, number>;
  supplierCount: number;
}

const RISK_CONFIG: Record<string, { label: string; color: string; bg: string; order: number }> = {
  LOW:     { label: 'Low risk',     color: '#10b981', bg: 'bg-emerald-500', order: 0 },
  MEDIUM:  { label: 'Medium risk',  color: '#f59e0b', bg: 'bg-amber-500',  order: 1 },
  HIGH:    { label: 'High risk',    color: '#ef4444', bg: 'bg-red-500',     order: 2 },
  UNKNOWN: { label: 'Unassessed',   color: '#94a3b8', bg: 'bg-slate-400',  order: 3 },
};

export function RiskBars({ breakdown, supplierCount }: RiskBarsProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const entries = Object.entries(breakdown)
    .map(([key, value]) => ({
      key,
      value,
      config: RISK_CONFIG[key] ?? { label: key, color: '#94a3b8', bg: 'bg-slate-400', order: 99 },
    }))
    .sort((a, b) => a.config.order - b.config.order);

  const maxValue = Math.max(...entries.map((e) => e.value), 1);

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => {
        const pct = Math.round((entry.value / (supplierCount || 1)) * 100);
        const barWidth = (entry.value / maxValue) * 100;
        const isHovered = hovered === entry.key;

        return (
          <div
            key={entry.key}
            className="group cursor-default"
            onMouseEnter={() => setHovered(entry.key)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0 transition-transform duration-200"
                  style={{
                    backgroundColor: entry.config.color,
                    transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                  }}
                />
                <span className="text-[13px] font-medium text-slate-700">{entry.config.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-slate-900 tabular-nums">{entry.value}</span>
                <span className="text-[11px] text-slate-400 tabular-nums w-10 text-right">{pct}%</span>
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full animate-bar-grow transition-all duration-300"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: entry.config.color,
                  animationDelay: `${i * 0.12 + 0.2}s`,
                  opacity: hovered && !isHovered ? 0.3 : 1,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
