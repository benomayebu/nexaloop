import Link from 'next/link';

export function EprCalculatorCTA() {
  return (
    <section className="relative py-20 bg-white overflow-hidden" id="epr-calculator">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234f46e5' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-700 text-xs font-semibold tracking-wide uppercase">
                Free tool &mdash; No account needed
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
              Know your Refashion EPR fees{' '}
              <span className="text-indigo-600">before the deadline</span>
            </h2>

            <p className="text-slate-500 text-lg leading-relaxed mb-6 max-w-lg">
              Our free Refashion EPR calculator helps fashion brands estimate annual
              eco-contribution fees in minutes &mdash; covering 80+ official product lines
              across clothing, household linen, and footwear.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/epr-calculator"
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-semibold px-6 py-3 rounded-xl transition-all duration-150 shadow-lg shadow-indigo-600/20"
              >
                Calculate your EPR fees
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <span className="text-sm text-slate-400 self-center">5 min &middot; No signup</span>
            </div>
          </div>

          {/* Right: mini preview card */}
          <div className="relative">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">
              {/* Top bar */}
              <div className="bg-slate-900 px-6 py-3 flex items-center justify-between">
                <span className="text-white text-sm font-medium">Refashion EPR Estimate</span>
                <span className="text-indigo-300 text-xs font-mono">2025 Annual</span>
              </div>
              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Stat row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Items</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">12,400</div>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Est. Fee</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">&euro;587.20</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Admin</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">&euro;30.00</div>
                  </div>
                </div>
                {/* Mini bar chart */}
                <div className="space-y-2.5">
                  {[
                    { label: 'T-shirt type tops (W)', pct: 65, amount: '&euro;226.10' },
                    { label: 'Denim trousers (M)', pct: 40, amount: '&euro;164.70' },
                    { label: 'Flat footwear (W)', pct: 25, amount: '&euro;108.60' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-3 text-xs">
                      <span className="w-32 text-slate-600 truncate">{row.label}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${row.pct}%` }} />
                      </div>
                      <span className="w-16 text-right font-mono text-slate-700" dangerouslySetInnerHTML={{ __html: row.amount }} />
                    </div>
                  ))}
                </div>
                {/* Footer note */}
                <div className="text-[10px] font-mono text-slate-400 text-center pt-2 border-t border-slate-100">
                  Indicative estimate &middot; Based on Refashion 2026 scales
                </div>
              </div>
            </div>
            {/* Decorative floating elements */}
            <div className="absolute -top-3 -right-3 w-20 h-20 bg-indigo-100 rounded-2xl -z-10 rotate-6" />
            <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-emerald-100 rounded-xl -z-10 -rotate-3" />
          </div>
        </div>
      </div>
    </section>
  );
}
