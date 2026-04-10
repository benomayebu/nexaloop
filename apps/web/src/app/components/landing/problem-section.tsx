'use client';

import { useScrollFadeIn } from '@/app/hooks/use-scroll-fade-in';

const PAIN_CARDS = [
  {
    icon: (
      <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
      </svg>
    ),
    body: 'Supplier certificates scattered across email threads and shared drives. Impossible to audit at speed. One missed expiry costs weeks of delays.',
  },
  {
    icon: (
      <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    body: 'Discovered an expired social audit during a retailer inspection. The order was delayed 6 weeks. It was a document that could have been tracked automatically.',
  },
  {
    icon: (
      <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    body: "A major buyer asked for a Digital Product Passport for your bestselling jacket. You had no idea where to start — or what data you even needed.",
  },
];

export function ProblemSection() {
  const headingRef = useScrollFadeIn();
  const cardsRef = useScrollFadeIn(0.1);

  return (
    <section className="bg-white py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={headingRef} className="scroll-fade text-center mb-14">
          <h2 className="font-display font-black text-slate-900 text-3xl sm:text-4xl leading-tight max-w-2xl mx-auto">
            We built N.E.X.A Loop because we watched fashion brands fail EU audits for preventable
            reasons.
          </h2>
        </div>

        <div ref={cardsRef} className="scroll-fade grid sm:grid-cols-3 gap-6">
          {PAIN_CARDS.map((card, i) => (
            <div
              key={i}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                {card.icon}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
