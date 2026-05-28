'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { DEFAULT_DATA } from '@/app/components/epr/calculate';
import type { EprFormData } from '@/app/components/epr/calculate';
import { EprLanding } from '@/app/components/epr/epr-landing';
import { BrandInfoStep } from '@/app/components/epr/brand-info-step';
import { ProductsStep } from '@/app/components/epr/products-step';
import { ResultsStep } from '@/app/components/epr/results-step';

export function EprCalculatorShell() {
  const [step, setStep] = useState(0); // 0=landing, 1=brand, 2=products, 3=results
  const [data, setData] = useState<EprFormData>({ ...DEFAULT_DATA });

  const startCalc = useCallback(() => {
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const restart = useCallback(() => {
    setData({ ...DEFAULT_DATA });
    setStep(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
              <span className="text-white font-bold text-xs">N</span>
            </div>
            <span className="font-bold text-sm text-slate-900 tracking-tight">N.E.X.A Loop</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-mono font-medium px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
              EPR Calculator &middot; Free tool
            </div>
            <Link
              href="/"
              className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              Back to N.E.X.A Loop
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        {step === 0 && <EprLanding onStart={startCalc} />}
        {step === 1 && (
          <BrandInfoStep
            data={data}
            setData={setData}
            onNext={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <ProductsStep
            data={data}
            setData={setData}
            onNext={() => { setStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && <ResultsStep data={data} onRestart={restart} />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Built by{' '}
            <Link href="/" className="text-indigo-600 hover:text-indigo-500 font-medium">
              N.E.X.A Loop
            </Link>{' '}
            &middot; Supply chain compliance, simplified.
          </span>
          <span className="font-mono">Indicative estimates only &middot; Not legal advice</span>
        </div>
      </footer>
    </div>
  );
}
