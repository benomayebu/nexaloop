'use client';

import { useState, useEffect } from 'react';

const CONSENT_KEY = 'cookie-consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if no decision has been made
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 pointer-events-none">
      <div className="max-w-lg mx-auto sm:mx-0 sm:ml-6 bg-white border border-slate-200 rounded-xl shadow-lg p-5 pointer-events-auto animate-dropdown-enter">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">Cookie preferences</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              We use essential cookies to make N.E.X.A Loop work. We&apos;d also like to set
              optional analytics cookies to help us improve the experience.
              Read our{' '}
              <a href="/privacy" className="text-indigo-600 hover:text-indigo-800 underline">
                privacy policy
              </a>.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={accept}
                className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition-colors"
              >
                Accept all
              </button>
              <button
                onClick={decline}
                className="px-3.5 py-1.5 bg-white text-slate-600 text-xs font-medium rounded-md border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Essential only
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
