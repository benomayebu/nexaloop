// Server component — no 'use client' needed

const VALUE_PROPS = [
  {
    title: 'Supplier Intelligence',
    desc: 'Track compliance scores across your entire supply chain in real time',
  },
  {
    title: 'DPP-Ready Architecture',
    desc: 'Digital Product Passport generation built directly into the platform',
  },
  {
    title: 'EU Regulatory Output',
    desc: 'ESPR, Textile EPR, CSRD reports generated on demand',
  },
  {
    title: 'Document Control',
    desc: 'Certifications, audits, expiry alerts — never miss a deadline again',
  },
];

const PILLS = ['ESPR', 'DPP', 'Textile EPR', 'CSRD'];

export function AuthLeftPanel() {
  return (
    <div
      className="hidden md:flex md:w-[42%] flex-col justify-between px-10 py-10 relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 55%, #1e1b4b 100%)',
      }}
    >
      {/* Mesh orb A */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.20) 0%, transparent 70%)',
        }}
      />
      {/* Mesh orb B */}
      <div
        className="pointer-events-none absolute -bottom-12 -left-12 w-56 h-56 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(129,140,248,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Logo */}
      <div className="relative flex items-center gap-2.5 z-10">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">N</span>
        </div>
        <span className="text-white font-bold text-base tracking-tight">N.E.X.A Loop</span>
      </div>

      {/* Value props */}
      <div className="relative z-10">
        <h2 className="font-display font-black text-2xl text-white leading-tight mb-7">
          EU compliance,{' '}
          <span className="text-indigo-300">without the chaos.</span>
        </h2>

        <ul className="space-y-5">
          {VALUE_PROPS.map((vp) => (
            <li key={vp.title} className="flex items-start gap-3">
              <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 text-xs">
                ✓
              </span>
              <div>
                <p className="text-slate-200 text-sm font-semibold">{vp.title}</p>
                <p className="text-slate-500 text-xs leading-relaxed mt-0.5">{vp.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer pills */}
      <div className="relative z-10">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {PILLS.map((pill) => (
            <span
              key={pill}
              className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs rounded-full px-2.5 py-0.5"
            >
              {pill}
            </span>
          ))}
        </div>
        <p className="text-slate-600 text-xs">Launching Q3 2026 · Built for EU fashion brands</p>
      </div>
    </div>
  );
}
