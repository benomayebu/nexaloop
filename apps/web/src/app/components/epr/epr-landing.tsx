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
          Calculate your{' '}
          <span className="text-indigo-600">Refashion EPR fees</span>{' '}
          in minutes
        </h1>

        <p className="text-lg text-slate-500 leading-relaxed max-w-xl mx-auto mb-8">
          Find out what your brand owes under France&apos;s Refashion textile EPR scheme.
          Enter your product lines and quantities, get your annual estimate &mdash; no spreadsheets needed.
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
          { icon: '80+', text: 'Product lines' },
          { icon: '5', text: 'Eco-modulation criteria' },
          { icon: '3', text: 'Categories (clothing, linen, footwear)' },
          { icon: '2', text: 'Declaration modes' },
        ].map((f) => (
          <div key={f.text} className="inline-flex items-center gap-2.5 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-700">
            <span className="text-indigo-600 font-semibold font-mono text-xs">{f.icon}</span>
            {f.text}
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="text-center text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
        This calculator provides indicative estimates based on the official Refashion 2026
        eco-fee scales. Verify all figures against your Refashion registration before filing.
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
            { num: '1', title: 'Declaration setup', desc: 'Enter your brand name, declaration year, and choose detailed or simplified mode.' },
            { num: '2', title: 'Add product lines', desc: 'Select Refashion product lines and enter the number of items placed on the French market.' },
            { num: '3', title: 'Get your estimate', desc: 'See your annual Refashion EPR fee broken down by product line with eco-modulation applied.' },
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

      {/* Important info banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-10">
        <h3 className="font-semibold text-slate-900 mb-3">Key dates for Refashion declarations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1">Declaration window</div>
            <div className="text-slate-800 font-medium">Jan 14 &ndash; Feb 28</div>
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1">Payment deadline</div>
            <div className="text-slate-800 font-medium">March 31</div>
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1">Non-compliance fine</div>
            <div className="text-slate-800 font-medium">Up to &euro;30,000</div>
          </div>
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
