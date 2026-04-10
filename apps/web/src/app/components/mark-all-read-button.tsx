'use client';

export function MarkAllReadButton() {
  async function handle() {
    try {
      await fetch('/api/notifications/read-all', { method: 'PATCH' });
      window.location.reload();
    } catch { /* ignore */ }
  }

  return (
    <button
      onClick={handle}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Mark all read
    </button>
  );
}
