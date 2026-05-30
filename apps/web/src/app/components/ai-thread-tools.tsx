'use client';

import { useState } from 'react';

// ─── Thread Summary ──────────────────────────────────────────────────

export function AiSummaryButton({ threadId }: { threadId: string }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchSummary() {
    if (summary) { setSummary(null); return; } // toggle off
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/threads/${threadId}/ai/summary`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  return (
    <div>
      <button
        onClick={fetchSummary}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors disabled:opacity-50"
      >
        <SparklesIcon />
        {loading ? 'Summarising...' : summary ? 'Hide summary' : 'Summarise'}
      </button>
      {summary && (
        <div className="mt-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-md text-xs text-indigo-800 leading-relaxed animate-dropdown-enter">
          <span className="font-semibold text-indigo-600 mr-1">AI Summary:</span>
          {summary}
        </div>
      )}
    </div>
  );
}

// ─── Reply Suggestions ───────────────────────────────────────────────

export function AiReplySuggestions({
  threadId,
  onSelect,
}: {
  threadId: string;
  onSelect: (text: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function fetchSuggestions() {
    if (open) { setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/threads/${threadId}/ai/replies`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.replies);
        setOpen(true);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  return (
    <div className="relative">
      <button
        onClick={fetchSuggestions}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-50"
      >
        <SparklesIcon />
        {loading ? 'Thinking...' : 'Suggest comment'}
      </button>
      {open && suggestions.length > 0 && (
        <div className="mt-1.5 space-y-1.5 animate-dropdown-enter">
          {suggestions.map((text, i) => (
            <button
              key={i}
              onClick={() => { onSelect(text); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-800 transition-colors leading-relaxed"
            >
              {text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Task Suggestions ────────────────────────────────────────────────

interface SuggestedTask {
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDays: number;
}

export function AiTaskSuggestions({
  threadId,
  onCreateTask,
}: {
  threadId: string;
  onCreateTask: (task: SuggestedTask) => void;
}) {
  const [tasks, setTasks] = useState<SuggestedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<Set<number>>(new Set());

  async function fetchTasks() {
    if (open) { setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/threads/${threadId}/ai/tasks`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
        setOpen(true);
        setCreated(new Set());
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  const priorityColors = {
    HIGH: 'text-red-600 bg-red-50',
    MEDIUM: 'text-amber-600 bg-amber-50',
    LOW: 'text-slate-600 bg-slate-100',
  };

  return (
    <div>
      <button
        onClick={fetchTasks}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-50"
      >
        <SparklesIcon />
        {loading ? 'Analysing...' : 'Suggest tasks'}
      </button>
      {open && tasks.length > 0 && (
        <div className="mt-1.5 space-y-1.5 animate-dropdown-enter">
          {tasks.map((task, i) => (
            <div
              key={i}
              className="flex items-start gap-2 px-3 py-2 bg-white border border-slate-200 rounded-md text-xs"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800">{task.title}</p>
                <p className="text-slate-500 mt-0.5">{task.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${priorityColors[task.priority]}`}>
                    {task.priority}
                  </span>
                  <span className="text-slate-400">Due in {task.dueDays} days</span>
                </div>
              </div>
              <button
                onClick={() => { onCreateTask(task); setCreated(new Set([...created, i])); }}
                disabled={created.has(i)}
                className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium transition-colors ${
                  created.has(i)
                    ? 'bg-emerald-50 text-emerald-600 cursor-default'
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                }`}
              >
                {created.has(i) ? 'Created' : 'Create'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sparkles Icon ───────────────────────────────────────────────────

function SparklesIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}
