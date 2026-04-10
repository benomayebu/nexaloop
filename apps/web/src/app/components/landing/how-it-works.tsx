'use client';

import { useScrollFadeIn } from '@/app/hooks/use-scroll-fade-in';

const STEPS = [
  {
    n: '01',
    title: 'Connect your suppliers',
    body: 'Add your supplier list in minutes. Import a spreadsheet or add manually. No IT project required.',
  },
  {
    n: '02',
    title: 'Track documents automatically',
    body: 'Define what documents each supplier tier needs. Upload certs, audits, and test reports. Get alerts before anything expires.',
  },
  {
    n: '03',
    title: 'Generate regulatory outputs on demand',
    body: 'Pull a Digital Product Passport, EPR volume export, or full audit pack in one click. Always ready for inspection.',
  },
];

export function HowItWorksSection() {
  const headingRef = useScrollFadeIn();
  const stepsRef = useScrollFadeIn(0.1);

  return (
    <section id="how-it-works" className="bg-white py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={headingRef} className="scroll-fade text-center mb-16">
          <h2 className="font-display font-black text-slate-900 text-3xl sm:text-4xl mb-4">
            Up and running in a day. Not a quarter.
          </h2>
          <p className="text-slate-500 text-lg max-w-md mx-auto">
            No lengthy onboarding. No professional services engagement. Just your data, organised.
          </p>
        </div>

        <div ref={stepsRef} className="scroll-fade relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-8 left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />

          <div className="grid md:grid-cols-3 gap-10 relative">
            {STEPS.map((step) => (
              <div key={step.n} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center mb-5 relative z-10">
                  <span className="font-display font-black text-indigo-600 text-xl">{step.n}</span>
                </div>
                <h3 className="font-display font-bold text-slate-900 text-base mb-3">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
