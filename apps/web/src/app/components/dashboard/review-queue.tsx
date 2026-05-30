'use client';

import { useState } from 'react';
import Link from 'next/link';

interface PendingDoc {
  id: string;
  createdAt: string;
  supplier: { id: string; name: string };
  documentType: { id: string; name: string };
}

interface ReviewQueueProps {
  documents: PendingDoc[];
}

function timeAgo(d: string): string {
  const now = Date.now();
  const then = new Date(d).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function ReviewQueue({ documents }: ReviewQueueProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-600">Inbox zero</p>
        <p className="text-xs text-slate-400 mt-0.5">No documents awaiting review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {documents.map((doc) => (
        <Link
          key={doc.id}
          href={`/dashboard/suppliers/${doc.supplier.id}?tab=documents`}
          className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
            hoveredId === doc.id ? 'bg-indigo-50/70 scale-[1.01]' : 'hover:bg-slate-50'
          }`}
          onMouseEnter={() => setHoveredId(doc.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          {/* Icon */}
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
            hoveredId === doc.id ? 'bg-indigo-100' : 'bg-slate-100'
          }`}>
            <svg className={`w-4 h-4 transition-colors duration-200 ${
              hoveredId === doc.id ? 'text-indigo-600' : 'text-slate-400'
            }`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
              {doc.documentType.name}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {doc.supplier.name}
            </p>
          </div>

          {/* Time + arrow */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] font-medium text-slate-400 tabular-nums">
              {timeAgo(doc.createdAt)}
            </span>
            <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </Link>
      ))}
    </div>
  );
}
