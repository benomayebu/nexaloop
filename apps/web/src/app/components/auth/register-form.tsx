'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/* ── Types ── */

type Step1Data = {
  orgName: string;
  country: string;
  vat: string;
};

type Step2Data = {
  name: string;
  email: string;
  password: string;
};

/* ── Shared bits ── */

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function ArrowUpRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7M17 7H7M17 7v10" />
    </svg>
  );
}

const COUNTRIES = [
  'Portugal',
  'Spain',
  'Italy',
  'France',
  'Germany',
  'Netherlands',
  'Denmark',
  'Sweden',
  'United Kingdom',
  'Other EU',
];

const inputClass =
  'block w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow';

const selectClass =
  'block w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow appearance-none cursor-pointer';

/* ── Component ── */

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);

  const step1Form = useForm<Step1Data>({ defaultValues: { country: 'Portugal' } });
  const step2Form = useForm<Step2Data>();

  const handleStep1 = step1Form.handleSubmit((data) => {
    setStep1Data(data);
    setStep(2);
  });

  const handleStep2 = step2Form.handleSubmit(async (data) => {
    if (!step1Data) return;
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name || undefined,
          email: data.email,
          password: data.password,
          orgName: step1Data.orgName,
          country: step1Data.country || undefined,
          vat: step1Data.vat || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        step2Form.setError('root', { message: err.message || 'Registration failed' });
        return;
      }
      router.push('/onboarding');
    } catch {
      step2Form.setError('root', { message: 'Network error. Please try again.' });
    }
  });

  return (
    <div className="w-full max-w-sm">
      <form onSubmit={step === 1 ? handleStep1 : handleStep2} noValidate className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create your workspace</h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Step {step} of 2 &mdash;{' '}
            {step === 1 ? 'about your brand' : 'your account'}
          </p>
        </div>

        {/* Root error (step 2 only) */}
        {step === 2 && step2Form.formState.errors.root && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
            {step2Form.formState.errors.root.message}
          </div>
        )}

        {/* ── STEP 1 — Brand details ── */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Brand name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Brand name
              </label>
              <input
                type="text"
                autoComplete="organization"
                autoFocus
                {...step1Form.register('orgName', { required: 'Brand name is required' })}
                className={inputClass}
                placeholder="e.g. Lumen Atelier"
              />
              {step1Form.formState.errors.orgName && (
                <p className="text-red-600 text-xs mt-1">
                  {step1Form.formState.errors.orgName.message}
                </p>
              )}
            </div>

            {/* Country + VAT row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Country
                </label>
                <select
                  {...step1Form.register('country')}
                  className={selectClass}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  VAT / Tax ID
                </label>
                <input
                  type="text"
                  {...step1Form.register('vat')}
                  className={inputClass}
                  placeholder="PT123456789"
                />
              </div>
            </div>

            {/* Continue */}
            <button
              type="submit"
              className="w-full h-10 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              Continue
              <ArrowUpRight />
            </button>
          </div>
        )}

        {/* ── STEP 2 — Account details ── */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Your name
              </label>
              <input
                type="text"
                autoComplete="name"
                autoFocus
                {...step2Form.register('name')}
                className={inputClass}
                placeholder="Jane Doe"
              />
            </div>

            {/* Work email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Work email
              </label>
              <input
                type="email"
                autoComplete="email"
                {...step2Form.register('email', { required: 'Email is required' })}
                className={inputClass}
                placeholder="you@brand.com"
              />
              {step2Form.formState.errors.email && (
                <p className="text-red-600 text-xs mt-1">
                  {step2Form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                {...step2Form.register('password', {
                  required: 'Password is required',
                  minLength: { value: 10, message: 'Minimum 10 characters' },
                })}
                className={inputClass}
                placeholder="10+ characters"
              />
              {step2Form.formState.errors.password ? (
                <p className="text-red-600 text-xs mt-1">
                  {step2Form.formState.errors.password.message}
                </p>
              ) : (
                <p className="text-slate-400 text-xs mt-1">
                  Minimum 10 characters, mix of letters and numbers.
                </p>
              )}
            </div>

            {/* Back + Create */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-10 px-4 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={step2Form.formState.isSubmitting}
                className="flex-1 h-10 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {step2Form.formState.isSubmitting ? (
                  <>
                    <Spinner />
                    Creating&hellip;
                  </>
                ) : (
                  'Create workspace'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Sign-in link */}
        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
