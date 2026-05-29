'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface ChecklistProps {
  hasSuppliers: boolean;
  hasProducts: boolean;
  hasDocuments: boolean;
  hasTeam: boolean;
}

const STEPS = [
  {
    key: 'supplier',
    title: 'Add your first supplier',
    desc: 'Import from CSV or add manually',
    href: '/dashboard/suppliers/new',
    cta: 'Add supplier',
    check: (p: ChecklistProps) => p.hasSuppliers,
  },
  {
    key: 'product',
    title: 'Create a product',
    desc: 'Map products to your supply chain',
    href: '/dashboard/products/new',
    cta: 'Add product',
    check: (p: ChecklistProps) => p.hasProducts,
  },
  {
    key: 'document',
    title: 'Upload a compliance document',
    desc: 'Certificates, audits, or test reports',
    href: '/dashboard/suppliers',
    cta: 'Go to suppliers',
    check: (p: ChecklistProps) => p.hasDocuments,
  },
  {
    key: 'team',
    title: 'Invite your team',
    desc: 'Collaborate on compliance tasks',
    href: '/dashboard/settings/team',
    cta: 'Team settings',
    check: (p: ChecklistProps) => p.hasTeam,
  },
] as const;

export function OnboardingChecklist(props: ChecklistProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('onboarding-dismissed') === 'true') {
      setDismissed(true);
    }
  }, []);

  const done = STEPS.filter((s) => s.check(props)).length;
  const allDone = done === STEPS.length;

  if (dismissed || allDone) return null;

  function handleDismiss() {
    localStorage.setItem('onboarding-dismissed', 'true');
    setDismissed(true);
  }

  const pct = Math.round((done / STEPS.length) * 100);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 mb-6 animate-page-enter">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Getting started</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {done}/{STEPS.length} complete &middot; {pct}%
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Dismiss
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {STEPS.map((step) => {
          const isComplete = step.check(props);
          return (
            <div
              key={step.key}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                isComplete ? 'bg-emerald-50/50' : 'bg-slate-50 hover:bg-slate-100'
              }`}
            >
              {/* Checkbox */}
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  isComplete
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-slate-300'
                }`}
              >
                {isComplete && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isComplete ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                  {step.title}
                </p>
                <p className="text-xs text-slate-500">{step.desc}</p>
              </div>

              {/* CTA */}
              {!isComplete && (
                <Link
                  href={step.href}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2.5 py-1 rounded-md hover:bg-indigo-50 transition-colors flex-shrink-0"
                >
                  {step.cta}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
