'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ExpiringDoc {
  id: string;
  expiryDate: string;
  supplier: { id: string; name: string };
  documentType: { id: string; name: string };
}

interface ExpiryTimelineProps {
  documents: ExpiringDoc[];
}

function daysUntil(d: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyConfig(days: number) {
  if (days <= 7) return { ring: 'ring-red-500/30 bg-red-50', dot: 'bg-red-500', text: 'text-red-700', label: 'Critical', pulse: true };
  if (days <= 14) return { ring: 'ring-red-400/20 bg-red-50/50', dot: 'bg-red-400', text: 'text-red-600', label: 'Urgent', pulse: false };
  if (days <= 30) return { ring: 'ring-amber-400/20 bg-amber-50/50', dot: 'bg-amber-500', text: 'text-amber-600', label: 'Soon', pulse: false };
  return { ring: 'ring-slate-200 bg-slate-50/50', dot: 'bg-slate-400', text: 'text-slate-500', label: 'Upcoming', pulse: false };
}

function fmtDateShort(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function ExpiryTimeline({ documents }: ExpiryTimelineProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-700">All clear</p>
        <p className="text-xs text-slate-400 mt-1 text-center">No documents expiring in the next 60 days.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline spine */}
      <div className="absolute left-[19px] top-3 bottom-3 w-px bg-gradient-to-b from-red-300 via-amber-300 to-slate-200" />

      <div className="space-y-1">
        {documents.map((doc, i) => {
          const days = daysUntil(doc.expiryDate);
          const config = urgencyConfig(days);
          const isHovered = hoveredId === doc.id;

          return (
            <Link
              key={doc.id}
              href={`/dashboard/suppliers/${doc.supplier.id}?tab=documents`}
              className={`group relative flex items-start gap-3.5 px-3 py-3 rounded-xl transition-all duration-200 ${
                isHovered ? 'bg-slate-50 scale-[1.01]' : ''
              }`}
              style={{ animationDelay: `${i * 0.06}s` }}
              onMouseEnter={() => setHoveredId(doc.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Timeline dot */}
              <div className={`relative z-10 w-[10px] h-[10px] rounded-full mt-1.5 flex-shrink-0 ${config.dot} ${config.pulse ? 'animate-pulse-ring' : ''} ring-4 ring-white`} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                      {doc.documentType.name}
                    </p>
                    <p className="text-[11.5px] text-slate-500 truncate mt-0.5">
                      {doc.supplier.name}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className={`text-[11px] font-bold ${config.text} tabular-nums`}>
                      {days <= 0 ? 'Overdue' : days === 1 ? '1 day' : `${days} days`}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {fmtDateShort(doc.expiryDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-all mt-1.5 flex-shrink-0 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
