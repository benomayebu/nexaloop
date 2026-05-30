'use client';

import { useState } from 'react';

interface Segment {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: Segment[];
  total: number;
  size?: number;
  label?: string;
}

export function DonutChart({ segments, total, size = 160, label }: DonutChartProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 10;

  // Calculate cumulative offsets
  let cumulative = 0;
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((seg) => {
      const pct = seg.value / (total || 1);
      const length = pct * circumference;
      const offset = cumulative;
      cumulative += length;
      return { ...seg, pct, length, offset };
    });

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
          {/* Background */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {/* Segments */}
          {arcs.map((arc, i) => (
            <circle
              key={arc.key}
              cx="50" cy="50" r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={hovered === arc.key ? strokeWidth + 3 : strokeWidth}
              strokeDasharray={`${arc.length} ${circumference - arc.length}`}
              strokeDashoffset={-arc.offset + circumference * 0.25}
              strokeLinecap="butt"
              className="transition-all duration-300 cursor-pointer"
              style={{
                opacity: hovered && hovered !== arc.key ? 0.4 : 1,
                animationDelay: `${i * 0.1 + 0.3}s`,
              }}
              onMouseEnter={() => setHovered(arc.key)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {hovered ? (
            <>
              <span className="text-xl font-bold text-slate-900 tabular-nums">
                {arcs.find((a) => a.key === hovered)?.value ?? 0}
              </span>
              <span className="text-[10px] font-medium text-slate-400 max-w-[60px] text-center leading-tight">
                {arcs.find((a) => a.key === hovered)?.label}
              </span>
            </>
          ) : (
            <>
              <span className="text-xl font-bold text-slate-900 tabular-nums">{total}</span>
              <span className="text-[10px] font-medium text-slate-400">{label ?? 'Total'}</span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 max-w-[220px]">
        {segments.filter((s) => s.value > 0).map((seg) => (
          <button
            key={seg.key}
            className={`flex items-center gap-1.5 text-[11px] transition-opacity duration-200 ${
              hovered && hovered !== seg.key ? 'opacity-40' : 'opacity-100'
            }`}
            onMouseEnter={() => setHovered(seg.key)}
            onMouseLeave={() => setHovered(null)}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-slate-600">{seg.label}</span>
            <span className="font-semibold text-slate-900 tabular-nums">{seg.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
