'use client';

import { useEffect, useState } from 'react';

export function MobileCTABar() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 2000);

    const earlyAccessEl = document.getElementById('early-access');
    if (!earlyAccessEl) return () => clearTimeout(showTimer);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setDismissed(true);
      },
      { threshold: 0.3 },
    );
    observer.observe(earlyAccessEl);

    return () => {
      clearTimeout(showTimer);
      observer.disconnect();
    };
  }, []);

  if (!visible || dismissed) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">EU compliance, simplified</p>
        <p className="text-slate-400 text-xs truncate">Launching Q3 2026</p>
      </div>
      <a
        href="#early-access"
        className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-150 flex-shrink-0"
      >
        Apply
      </a>
      <button
        onClick={() => setDismissed(true)}
        className="text-slate-500 hover:text-slate-300 p-1 transition-colors flex-shrink-0"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
