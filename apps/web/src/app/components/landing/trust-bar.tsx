const TRUST_ITEMS = [
  'Designed for ESPR compliance',
  'Built for EU fashion brands',
  'DPP-ready',
  'EPR-compliant architecture',
  'Launching 2026',
];

export function TrustBar() {
  return (
    <div className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2">
          {TRUST_ITEMS.map((item, i) => (
            <div key={item} className="flex items-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                {item}
              </span>
              {i < TRUST_ITEMS.length - 1 && (
                <span className="mx-3 text-slate-700 select-none">·</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
