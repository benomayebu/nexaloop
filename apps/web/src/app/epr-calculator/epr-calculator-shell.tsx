'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { DEFAULT_DATA } from '@/app/components/epr/calculate';
import type { EprFormData } from '@/app/components/epr/calculate';
import { EprLanding } from '@/app/components/epr/epr-landing';
import { BrandInfoStep } from '@/app/components/epr/brand-info-step';
import { ProductsStep } from '@/app/components/epr/products-step';
import { ResultsStep } from '@/app/components/epr/results-step';

const STORAGE_KEY = 'nexaloop_epr_calculator';

function loadSavedData(): { data: EprFormData; step: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.data?.brandName && parsed?.step >= 1) {
      return { data: parsed.data, step: parsed.step };
    }
  } catch {
    // corrupted data — ignore
  }
  return null;
}

function saveData(data: EprFormData, step: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, step, savedAt: Date.now() }));
  } catch {
    // storage full or unavailable — ignore
  }
}

function clearSavedData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function EprCalculatorShell() {
  const [step, setStep] = useState(0); // 0=landing, 1=brand, 2=products, 3=results
  const [data, setData] = useState<EprFormData>({ ...DEFAULT_DATA });
  const [hasSaved, setHasSaved] = useState(false);
  const initialised = useRef(false);

  // Check for saved data on mount
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    const saved = loadSavedData();
    if (saved) {
      setHasSaved(true);
    }
  }, []);

  // Persist data to localStorage when it changes (only after user starts)
  useEffect(() => {
    if (step >= 1) {
      saveData(data, step);
    }
  }, [data, step]);

  const startCalc = useCallback(() => {
    setHasSaved(false);
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const resumeCalc = useCallback(() => {
    const saved = loadSavedData();
    if (saved) {
      setData(saved.data);
      setStep(saved.step);
      setHasSaved(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const dismissSaved = useCallback(() => {
    clearSavedData();
    setHasSaved(false);
  }, []);

  const restart = useCallback(() => {
    clearSavedData();
    setData({ ...DEFAULT_DATA });
    setStep(0);
    setHasSaved(false);
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

      {/* Resume banner */}
      {hasSaved && step === 0 && (
        <div className="bg-indigo-600 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <svg className="w-5 h-5 text-indigo-200 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span className="text-sm font-medium">You have an unfinished calculation</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-4 py-1.5 text-sm font-semibold bg-white text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors"
                onClick={resumeCalc}
              >
                Resume
              </button>
              <button
                className="px-4 py-1.5 text-sm font-medium text-indigo-200 hover:text-white transition-colors"
                onClick={dismissSaved}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

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
