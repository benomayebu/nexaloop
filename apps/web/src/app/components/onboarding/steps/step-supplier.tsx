// apps/web/src/app/components/onboarding/steps/step-supplier.tsx
'use client';

import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import type { MeResponse } from '../types';

type Props = {
  me: MeResponse;
  onNext: (data: { supplierName: string; supplierCountry: string }) => void;
  onBack: () => void;
  onSkip: () => void;
};

type SupplierFormData = {
  supplierName: string;
  supplierCountry: string;
};

const stepVariants = {
  enter: { x: 60, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -60, opacity: 0 },
};

const COUNTRIES = [
  'Bangladesh', 'Belgium', 'Bulgaria', 'Cambodia', 'China', 'Croatia',
  'Czech Republic', 'Denmark', 'Estonia', 'Ethiopia', 'Finland', 'France',
  'Germany', 'Greece', 'Hungary', 'India', 'Indonesia', 'Ireland', 'Italy',
  'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Morocco', 'Myanmar',
  'Netherlands', 'Norway', 'Pakistan', 'Poland', 'Portugal', 'Romania',
  'Slovakia', 'Slovenia', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland',
  'Tunisia', 'Turkey', 'United Kingdom', 'Vietnam',
];

const inputClass =
  'block w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow';

export function StepSupplier({ me, onNext, onBack, onSkip }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormData>();

  const subtitle = me.org.supplierCount
    ? `You mentioned ${me.org.supplierCount} suppliers. Start with your most important one — you can add the rest later.`
    : 'Start with your most important supplier — you can add the rest later.';

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
        <div className="h-1 flex-1 bg-indigo-600 rounded-full" />
        <div className="h-1 flex-1 bg-slate-200 rounded-full" />
      </div>

      <h2 className="font-display text-xl font-black text-slate-900 mb-2">
        Add your first supplier
      </h2>
      <p className="text-sm text-slate-500 mb-6">{subtitle}</p>

      <form onSubmit={handleSubmit(onNext)} noValidate className="space-y-4">
        {/* Supplier name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Supplier name
          </label>
          <input
            type="text"
            placeholder="e.g. Milano Textiles S.p.A."
            {...register('supplierName', {
              required: 'Supplier name is required',
              minLength: { value: 2, message: 'Must be at least 2 characters' },
            })}
            className={inputClass}
          />
          {errors.supplierName && (
            <p className="text-red-600 text-xs mt-1">{errors.supplierName.message}</p>
          )}
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Country
          </label>
          <select
            {...register('supplierCountry', { required: 'Country is required' })}
            className="block w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow"
            defaultValue=""
          >
            <option value="" disabled>
              Select country…
            </option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.supplierCountry && (
            <p className="text-red-600 text-xs mt-1">{errors.supplierCountry.message}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-3 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
          >
            ← Back
          </button>
          <button
            type="submit"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
          >
            Add supplier →
          </button>
        </div>
      </form>

      {/* Skip */}
      <button
        onClick={onSkip}
        className="block w-full text-center mt-4 text-xs text-slate-400 hover:text-slate-600 transition-colors"
      >
        Skip for now
      </button>
    </motion.div>
  );
}
