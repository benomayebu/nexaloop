'use client';

// Compliance standard logos as styled text marks (no fake client logos — this is pre-launch).
// Uses a CSS infinite scroll animation for the marquee effect.

const STANDARDS = [
  { label: 'ESPR', desc: 'EU Sustainable Products Regulation' },
  { label: 'EPR', desc: 'Extended Producer Responsibility' },
  { label: 'REACH', desc: 'Chemical Safety Regulation' },
  { label: 'OEKO-TEX', desc: 'Textile Safety Standard' },
  { label: 'BSCI', desc: 'Social Compliance Initiative' },
  { label: 'ISO 14001', desc: 'Environmental Management' },
  { label: 'DPP', desc: 'Digital Product Passport' },
  { label: 'GRS', desc: 'Global Recycled Standard' },
];

function LogoMark({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="flex items-center gap-2.5 px-5 flex-shrink-0">
      <span className="text-sm font-bold text-slate-300 tracking-wide font-mono">
        {label}
      </span>
      <span className="text-[11px] text-slate-500 hidden sm:inline">
        {desc}
      </span>
    </div>
  );
}

export function TrustBar() {
  // Duplicate for seamless loop
  const items = [...STANDARDS, ...STANDARDS];

  return (
    <div className="bg-slate-900 border-t border-slate-800 overflow-hidden">
      <div className="py-5">
        {/* Label */}
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600 mb-3">
          Built for EU compliance standards
        </p>

        {/* Scrolling marquee */}
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />

          <div className="flex animate-marquee">
            {items.map((item, i) => (
              <LogoMark key={`${item.label}-${i}`} label={item.label} desc={item.desc} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
