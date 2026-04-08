'use client';

export function HeroVisual() {
  return (
    <div className="relative hidden lg:flex items-center justify-center">
      {/* Floating card */}
      <div
        className="relative w-[340px] rounded-2xl border border-slate-700 bg-slate-800/90 backdrop-blur-sm shadow-2xl overflow-hidden"
        style={{ animation: 'card-float 4s ease-in-out infinite' }}
      >
        {/* Card header */}
        <div className="px-5 py-4 border-b border-slate-700/60 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Compliance Overview
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Eko Textiles Group</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">Live</span>
          </div>
        </div>

        {/* Score gauge row */}
        <div className="px-5 py-4 flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="28" fill="none" stroke="#1e293b" strokeWidth="6" />
              <circle
                cx="36" cy="36" r="28"
                fill="none"
                stroke="#10b981"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="175.9"
                strokeDashoffset="26"
                transform="rotate(-90 36 36)"
                style={{ animation: 'gauge-fill 1.2s ease-out 0.3s both' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold font-display text-white leading-none">85</span>
              <span className="text-[9px] text-slate-400 font-medium">/100</span>
            </div>
          </div>

          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Compliance Score</p>
            <p className="text-xs text-slate-400 mt-0.5">12 suppliers · 47 documents</p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-emerald-400 text-xs font-semibold">↑ 4pts</span>
              <span className="text-slate-500 text-xs">this month</span>
            </div>
          </div>
        </div>

        {/* Supplier rows */}
        <div className="px-5 pb-2 space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[10px] font-bold">NK</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-white truncate">Nordic Linen Mills</span>
                <span className="text-xs text-emerald-400 font-semibold ml-2">92%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '92%' }} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-teal-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[10px] font-bold">BF</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-white truncate">Baltic Flax Spinners</span>
                <span className="text-xs text-amber-400 font-semibold ml-2">68%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: '68%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Alert chip */}
        <div className="mx-5 mb-4 mt-3 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span className="text-xs text-amber-300 font-medium">3 documents expire in 14 days</span>
        </div>
      </div>

      {/* Illustrative label */}
      <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 italic whitespace-nowrap">
        Illustrative example
      </p>
    </div>
  );
}
