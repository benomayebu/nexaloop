import { WaitlistForm } from './waitlist-form';

const TRUST_BADGES = [
  '🔒 GDPR compliant architecture',
  '🐘 Enterprise-grade PostgreSQL',
  '🔌 Open API',
];

export function EarlyAccessSection() {
  return (
    <section id="early-access" className="bg-indigo-950 py-24">
      <div className="max-w-lg mx-auto px-4 sm:px-6 text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 bg-indigo-500/15 border border-indigo-500/25 rounded-full px-4 py-1.5 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-indigo-300 text-xs font-semibold tracking-wide uppercase">
            Private beta
          </span>
        </div>

        <h2 className="font-display font-black text-white text-3xl sm:text-4xl mb-4">
          Currently in private beta
        </h2>

        <p className="text-indigo-200 text-base mb-4">
          We are working with a small group of founding brands to shape the product. Apply for early
          access below.
        </p>

        <p className="text-indigo-300 text-sm font-semibold mb-10">
          The first 50 brands accepted receive 6 months free and direct input into the product
          roadmap.
        </p>

        {/* Form */}
        <WaitlistForm />

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
          {TRUST_BADGES.map((badge) => (
            <span
              key={badge}
              className="bg-white/5 border border-white/10 text-indigo-300 text-xs font-medium px-3 py-1.5 rounded-full"
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Testimonials placeholder — do not remove this comment */}
        {/* Testimonials: add when first 3 real customers confirmed with written consent.
            Real name, real company, real quote only. No paraphrasing. */}
      </div>
    </section>
  );
}
