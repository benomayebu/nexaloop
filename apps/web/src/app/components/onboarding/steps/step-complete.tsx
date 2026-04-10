// apps/web/src/app/components/onboarding/steps/step-complete.tsx
'use client';

import { motion } from 'framer-motion';
import type { MeResponse } from '../types';

type Props = {
  me: MeResponse;
  supplierAdded: boolean;
  onComplete: () => void;
  isLoading: boolean;
};

const stepVariants = {
  enter: { x: 60, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -60, opacity: 0 },
};

export function StepComplete({ me, supplierAdded, onComplete, isLoading }: Props) {
  const pillLabel = me.org.primaryConcern === 'All of the above'
    ? 'ESPR · EPR · CSRD'
    : (me.org.primaryConcern ?? 'EU Compliance');

  return (
    <motion.div
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white rounded-2xl p-8 text-center"
    >
      {/* Progress bar — all filled */}
      <div className="flex gap-1 mb-8">
        <div className="h-1 flex-1 bg-indigo-600 rounded-full" />
        <div className="h-1 flex-1 bg-indigo-600 rounded-full" />
        <div className="h-1 flex-1 bg-indigo-600 rounded-full" />
        <div className="h-1 flex-1 bg-indigo-600 rounded-full" />
      </div>

      {/* Animated checkmark */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
        }}
      >
        <span className="text-white text-2xl font-bold">✓</span>
      </motion.div>

      <h2 className="font-display text-2xl font-black text-slate-900 mb-2">
        You&apos;re all set!
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        <span className="font-medium text-slate-700">{me.org.name}</span> is ready to track EU
        compliance. Your dashboard is waiting.
      </p>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        <span className="bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold rounded-full px-3 py-1">
          {pillLabel}
        </span>
        {supplierAdded && (
          <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full px-3 py-1">
            1 supplier added
          </span>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={onComplete}
        disabled={isLoading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl py-3 text-sm font-semibold transition-colors"
      >
        {isLoading ? 'Setting up…' : 'Go to my dashboard →'}
      </button>
    </motion.div>
  );
}
