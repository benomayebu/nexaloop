'use client';

import { motion } from 'framer-motion';
import type { MeResponse } from '../types';

type Props = {
  me: MeResponse;
  onNext: () => void;
};

const stepVariants = {
  enter: { x: 60, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -60, opacity: 0 },
};

type ComplianceContent = {
  pill: string;
  facts: string[];
};

const COMPLIANCE_CONTENT: Record<string, ComplianceContent> = {
  'ESPR / DPP': {
    pill: 'ESPR / DPP',
    facts: [
      'ESPR mandates Digital Product Passports for textiles from 2027',
      'DPP requires material composition, origin, and repairability data per SKU',
      'We generate DPP-ready records from your supplier documents',
    ],
  },
  'Textile EPR': {
    pill: 'Textile EPR',
    facts: [
      'EU Textile EPR requires producer responsibility for end-of-life textile collection from 2025',
      'Supplier certifications (GOTS, bluesign, Oeko-Tex) count toward your compliance score',
      'We alert you 60 days before any certification expires',
    ],
  },
  'CSRD': {
    pill: 'CSRD',
    facts: [
      'CSRD requires Scope 3 supply chain emissions reporting from 2025',
      'Supplier-level traceability is a core data requirement under CSRD',
      'We structure your supplier data to feed directly into CSRD disclosures',
    ],
  },
  'All of the above': {
    pill: 'ESPR · EPR · CSRD',
    facts: [
      'Your dashboard tracks ESPR/DPP, Textile EPR, and CSRD requirements',
      'Supplier certifications and documents feed all three regulatory frameworks',
      'We alert you 60 days before any certification expires',
    ],
  },
};

const FALLBACK: ComplianceContent = {
  pill: 'EU Compliance',
  facts: [
    'We track supplier certifications, document expiry, and regulatory deadlines',
    'Compliance scores update automatically as you add supplier documents',
    'We alert you 60 days before any certification expires',
  ],
};

export function StepCompliance({ me, onNext }: Props) {
  const content = me.org.primaryConcern
    ? (COMPLIANCE_CONTENT[me.org.primaryConcern] ?? FALLBACK)
    : FALLBACK;

  return (
    <motion.div
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white rounded-2xl p-8"
    >
      {/* Progress bar */}
      <div className="flex gap-1 mb-8">
        <div className="h-1 flex-1 bg-indigo-600 rounded-full" />
        <div className="h-1 flex-1 bg-indigo-600 rounded-full" />
        <div className="h-1 flex-1 bg-slate-200 rounded-full" />
        <div className="h-1 flex-1 bg-slate-200 rounded-full" />
      </div>

      {/* Regulation pill */}
      <span className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold rounded-full px-3 py-1 mb-4">
        🏷️ {content.pill}
      </span>

      <h2 className="font-display text-xl font-black text-slate-900 mb-2">
        Your compliance roadmap
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        Based on your focus, here&apos;s what N.E.X.A Loop will track for you:
      </p>

      {/* Facts */}
      <ul className="space-y-3 mb-8">
        {content.facts.map((fact) => (
          <li key={fact} className="flex gap-3 text-sm text-slate-700">
            <span className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 text-emerald-700 text-xs font-bold mt-0.5">
              ✓
            </span>
            {fact}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={onNext}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
      >
        Got it, continue →
      </button>
    </motion.div>
  );
}
