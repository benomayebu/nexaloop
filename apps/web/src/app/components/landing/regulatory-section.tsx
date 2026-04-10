'use client';

import { useScrollFadeIn } from '@/app/hooks/use-scroll-fade-in';

const PILLARS = [
  {
    label: 'ESPR & Digital Product Passports',
    body: 'The EU Ecodesign for Sustainable Products Regulation requires product-level traceability data. N.E.X.A Loop structures your data to meet DPP requirements from day one.',
  },
  {
    label: 'Textile EPR',
    body: 'Extended Producer Responsibility schemes are rolling out across EU member states. Our EPR export module generates the volume declarations you need.',
  },
  {
    label: 'CSRD Due Diligence',
    body: 'Larger buyers and investors require ESG supply chain data. N.E.X.A Loop gives you the traceability evidence to support your CSRD disclosures.',
  },
  {
    label: 'Aligned with EU Textile Strategy 2030',
    body: 'Built around the regulatory roadmap — not patched onto it. Every data model reflects how EU compliance is evolving.',
  },
];

export function RegulatorySection() {
  const headingRef = useScrollFadeIn();
  const gridRef = useScrollFadeIn(0.1);

  return (
    <section id="regulatory" className="bg-slate-50 py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={headingRef} className="scroll-fade text-center mb-12">
          <h2 className="font-display font-black text-slate-900 text-3xl sm:text-4xl mb-4">
            Built for where regulation is heading
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Not a generic platform stretched to fit compliance. Built from the ground up for EU
            fashion regulation.
          </p>
        </div>

        <div ref={gridRef} className="scroll-fade grid sm:grid-cols-2 gap-6">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.label}
              className="bg-white border border-slate-200 rounded-2xl p-7 hover:border-indigo-200 hover:shadow-md transition-all duration-200"
            >
              <span className="inline-block bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1 rounded-full mb-4">
                {pillar.label}
              </span>
              <p className="text-slate-600 text-sm leading-relaxed">{pillar.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
