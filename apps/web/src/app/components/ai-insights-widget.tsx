'use client';

import { useState } from 'react';

interface Insight {
  icon: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export function AiInsightsWidget() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function fetchInsights() {
    if (open) { setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/insights');
      if (res.ok) {
        const data = await res.json();
        setInsights(data.insights ?? []);
        setOpen(true);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  const priorityColor = {
    high: 'border-l-red-400 bg-red-50/50',
    medium: 'border-l-amber-400 bg-amber-50/50',
    low: 'border-l-indigo-400 bg-indigo-50/50',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Compliance assistant</h2>
            <p className="text-[11px] text-slate-500">AI-powered insights for your supply chain</p>
          </div>
        </div>
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors disabled:opacity-50"
        >
          {loading ? (
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          )}
          {loading ? 'Analysing...' : open ? 'Hide insights' : 'Generate insights'}
        </button>
      </div>

      {open && insights.length > 0 && (
        <div className="p-4 space-y-2 animate-dropdown-enter">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`border-l-3 rounded-md px-4 py-3 ${priorityColor[insight.priority]}`}
              style={{ borderLeftWidth: 3 }}
            >
              <div className="flex items-start gap-2">
                <span className="text-base flex-shrink-0 mt-0.5">{insight.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{insight.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{insight.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && insights.length === 0 && (
        <div className="p-6 text-center animate-dropdown-enter">
          <p className="text-sm text-emerald-600 font-medium">All clear</p>
          <p className="text-xs text-slate-400 mt-1">No actionable insights at this time.</p>
        </div>
      )}
    </div>
  );
}
