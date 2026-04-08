import Link from 'next/link';
import { HeroVisual } from './hero-visual';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center bg-slate-900 overflow-hidden pt-16">
      {/* Animated mesh gradient orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(79,70,229,1) 0%, transparent 70%)',
          animation: 'mesh-a 12s ease-in-out infinite',
          opacity: 0.12,
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,1) 0%, transparent 70%)',
          animation: 'mesh-b 16s ease-in-out infinite',
          opacity: 0.1,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center py-20 lg:py-28">
          {/* Left: copy */}
          <div>
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span className="text-indigo-300 text-xs font-semibold tracking-wide uppercase">
                EU Supply Chain Compliance Platform
              </span>
            </div>

            <h1 className="font-display font-black text-white leading-[1.08] tracking-tight text-4xl sm:text-5xl lg:text-[56px] mb-6">
              Know exactly where your products come from.{' '}
              <span className="text-indigo-400">Prove it.</span>
            </h1>

            <p className="text-slate-300 text-lg leading-relaxed mb-10 max-w-xl">
              N.E.X.A Loop gives EU-facing fashion brands complete supply chain visibility, document
              control, and regulatory readiness — in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="#early-access"
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold px-6 py-3.5 rounded-xl transition-all duration-150 shadow-lg shadow-indigo-900/40"
              >
                Apply for early access
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 active:scale-95 text-white font-semibold px-6 py-3.5 rounded-xl border border-white/15 transition-all duration-150"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* Right: compliance card visual */}
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
