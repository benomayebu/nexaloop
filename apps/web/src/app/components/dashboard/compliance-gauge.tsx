'use client';

import { useEffect, useRef, useState } from 'react';

interface ComplianceGaugeProps {
  score: number;
  label?: string;
  size?: number;
}

function scoreGradient(score: number): [string, string] {
  if (score >= 85) return ['#10b981', '#059669']; // emerald
  if (score >= 65) return ['#f59e0b', '#d97706']; // amber
  return ['#ef4444', '#dc2626']; // red
}

function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Needs work';
}

export function ComplianceGauge({ score, label, size = 180 }: ComplianceGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const ref = useRef<SVGCircleElement>(null);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const [c1, c2] = scoreGradient(score);

  // Animate the number counting up
  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * score);
      setAnimatedScore(start);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="transform -rotate-90" style={{ width: size, height: size }}>
          {/* Background track */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={c1} />
              <stop offset="100%" stopColor={c2} />
            </linearGradient>
            <filter id="gauge-glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          {/* Active arc */}
          <circle
            ref={ref}
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="url(#gauge-gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            filter="url(#gauge-glow)"
            className="animate-gauge"
            style={{
              '--gauge-circumference': circumference,
              '--gauge-target': strokeDashoffset,
            } as React.CSSProperties}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900 tabular-nums animate-num-reveal">
            {animatedScore}%
          </span>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
            {scoreLabel(score)}
          </span>
        </div>
      </div>
      {label && (
        <span className="text-xs font-medium text-slate-500">{label}</span>
      )}
    </div>
  );
}
