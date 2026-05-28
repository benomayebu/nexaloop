'use client';

import Link from 'next/link';

export function EprLanding({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero */}
      <div className="text-center pt-8 pb-10">
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
          <span className="text-indigo-700 text-xs font-semibold tracking-wide uppercase font-mono">
            Free tool &middot; No account needed
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-5">
          Calculate your EU{' '}
          <span className="text-indigo-600">EPR fees</span>{' '}
          in minutes
        </h1>

        <p className="text-lg text-slate-500 leading-relaxed max-w-xl mx-auto mb-8">
          Find out what your brand owes under France&apos;s Refashion textile EPR scheme.
          Enter your materials, get your quarterly estimate &mdash; no spreadsheets needed.
        </p>

        <button
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-semibold px-7 py-3.5 rounded-xl transition-all duration-150 shadow-lg shadow-indigo-600/25 text-[15px]"
          onClick={onStart}
        >
          Start calculating
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {[
          { icon: '15', text: 'Material categories' },
          { icon: '6', text: 'Eco-modulation criteria' },
          { icon: '€', text: 'Indicative fee calculation' },
          { icon: '⬇', text: 'PDF declaration preview' },
        ].map((f) => (
          <div key={f.text} className="inline-flex items-center gap-2.5 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-700">
            <span className="text-indigo-600 font-semibold font-mono text-xs">{f.icon}</span>
            {f.text}
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="text-center text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
        This calculator provides indicative estimates based on simplified Refashion 2025 rate
        approximations. Verify all figures against the official rate table before filing.
        Not legal or compliance advice.
      </p>

      {/* Separator */}
      <div className="border-t border-slate-200 mt-12 mb-10" />

      {/* How it works */}
      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-3">How it works</h2>
        <p className="text-slate-500 text-[15px] mb-8">Three steps, five minutes, no account required.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { num: '1', title: 'Enter brand details', desc: 'Tell us your brand name, reporting quarter, and EU markets.' },
            { num: '2', title: 'Add your materials', desc: 'Select material types and enter weight in kg placed on the French market.' },
            { num: '3', title: 'Get your estimate', desc: 'See your quarterly Refashion EPR fee broken down by material with a PDF preview.' },
          ].map((step) => (
            <div key={step.num} className="text-left bg-white border border-slate-200 rounded-xl p-5">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white grid place-items-center text-sm font-mono font-semibold mb-3">
                {step.num}
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Platform CTA */}
      <div className="text-center pb-8">
        <p className="text-sm text-slate-500 mb-3">
          Need full compliance tracking, supplier management, and DPP generation?
        </p>
        <Link
          href="/#early-access"
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
        >
          Explore N.E.X.A Loop platform &rarr;
        </Link>
      </div>
    </div>
  );
}
