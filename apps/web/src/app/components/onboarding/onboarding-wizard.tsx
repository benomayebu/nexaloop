// apps/web/src/app/components/onboarding/onboarding-wizard.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { StepWelcome } from './steps/step-welcome';
import { StepCompliance } from './steps/step-compliance';
import { StepSupplier } from './steps/step-supplier';
import { StepComplete } from './steps/step-complete';
import type { MeResponse } from './types';

type Props = {
  me: MeResponse;
};

type SupplierData = {
  supplierName: string;
  supplierCountry: string;
};

export function OnboardingWizard({ me }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [supplierData, setSupplierData] = useState<SupplierData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const advance = () => setStep((s) => Math.min(s + 1, 4) as 1 | 2 | 3 | 4);
  const back = () => setStep((s) => Math.max(s - 1, 1) as 1 | 2 | 3 | 4);

  const completeOnboarding = async (data?: SupplierData) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data ?? {}),
      });
      if (res.ok) {
        router.push('/dashboard');
      } else {
        setIsLoading(false);
      }
    } catch {
      setIsLoading(false);
    }
  };

  const skip = () => completeOnboarding();

  const handleSupplierNext = (data: SupplierData) => {
    setSupplierData(data);
    advance();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8"
      style={{
        background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 55%, #1e1b4b 100%)',
      }}
    >
      {/* Mesh orbs */}
      <div
        className="hidden md:block absolute pointer-events-none -top-16 -right-16 w-64 h-64"
        style={{
          background:
            'radial-gradient(circle, rgba(99,102,241,0.20) 0%, transparent 70%)',
        }}
      />
      <div
        className="hidden md:block absolute pointer-events-none -bottom-12 -left-12 w-48 h-48"
        style={{
          background:
            'radial-gradient(circle, rgba(129,140,248,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <StepWelcome key="step-1" me={me} onNext={advance} />
          )}
          {step === 2 && (
            <StepCompliance key="step-2" me={me} onNext={advance} />
          )}
          {step === 3 && (
            <StepSupplier
              key="step-3"
              me={me}
              onNext={handleSupplierNext}
              onBack={back}
              onSkip={skip}
            />
          )}
          {step === 4 && (
            <StepComplete
              key="step-4"
              me={me}
              supplierAdded={supplierData !== null}
              onComplete={() => completeOnboarding(supplierData ?? undefined)}
              isLoading={isLoading}
            />
          )}
        </AnimatePresence>

        {/* Skip setup — visible on steps 1 and 2 only */}
        {(step === 1 || step === 2) && (
          <button
            onClick={skip}
            className="block mx-auto mt-5 text-xs text-indigo-300 hover:text-white transition-colors"
          >
            Skip setup
          </button>
        )}
      </div>
    </div>
  );
}
