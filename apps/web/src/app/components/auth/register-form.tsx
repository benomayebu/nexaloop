'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Step1Data = {
  name: string;
  email: string;
  password: string;
};

type Step2Data = {
  orgName: string;
  industry: string;
  supplierCount: string;
  primaryConcern: string;
};

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
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2 mb-7">
      {/* Step 1 */}
      <div className="flex items-center gap-1.5">
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
            step === 1
              ? 'bg-indigo-600 text-white'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {step === 1 ? '1' : '✓'}
        </span>
        <span className={`text-xs ${step === 1 ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
          Your account
        </span>
      </div>
      {/* Connector */}
      <div className={`h-px flex-1 ${step === 2 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
      {/* Step 2 */}
      <div className="flex items-center gap-1.5">
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border ${
            step === 2
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-slate-100 text-slate-400 border-slate-200'
          }`}
        >
          2
        </span>
        <span className={`text-xs ${step === 2 ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
          Your company
        </span>
      </div>
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);

  const step1Form = useForm<Step1Data>();
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
          name: step1Data.name || undefined,
          email: step1Data.email,
          password: step1Data.password,
          orgName: data.orgName,
          industry: data.industry || undefined,
          supplierCount: data.supplierCount || undefined,
          primaryConcern: data.primaryConcern || undefined,
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

  const inputClass =
    'block w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow';

  const selectClass =
    'block w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow appearance-none cursor-pointer';

  return (
    <div className="w-full max-w-sm">
      <StepIndicator step={step} />

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <>
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
            <p className="text-sm text-slate-500 mt-1">Get started with N.E.X.A Loop</p>
          </div>

          <form onSubmit={handleStep1} noValidate className="space-y-4">
            {/* Full name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Full name
              </label>
              <input
                type="text"
                autoComplete="name"
                {...step1Form.register('name')}
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
                {...step1Form.register('email', { required: 'Email is required' })}
                className={inputClass}
                placeholder="jane@brand.com"
              />
              {step1Form.formState.errors.email && (
                <p className="text-red-600 text-xs mt-1">
                  {step1Form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password{' '}
                <span className="text-slate-400 font-normal">(min. 8 characters)</span>
              </label>
              <input
                type="password"
                autoComplete="new-password"
                {...step1Form.register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Minimum 8 characters' },
                })}
                className={inputClass}
              />
              {step1Form.formState.errors.password && (
                <p className="text-red-600 text-xs mt-1">
                  {step1Form.formState.errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              Continue →
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Sign in
            </Link>
          </p>
        </>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Tell us about your company</h1>
            <p className="text-sm text-slate-500 mt-1">
              Helps us tailor your compliance setup{' '}
              <span className="text-slate-400">· Optional</span>
            </p>
          </div>

          <form onSubmit={handleStep2} noValidate className="space-y-4">
            {/* Root error */}
            {step2Form.formState.errors.root && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
                {step2Form.formState.errors.root.message}
              </div>
            )}

            {/* Org name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Organisation name{' '}
                <span className="text-red-500 text-xs">required</span>
              </label>
              <input
                type="text"
                autoComplete="organization"
                {...step2Form.register('orgName', { required: 'Organisation name is required' })}
                className={inputClass}
                placeholder="Acme Fashion Co."
              />
              {step2Form.formState.errors.orgName && (
                <p className="text-red-600 text-xs mt-1">
                  {step2Form.formState.errors.orgName.message}
                </p>
              )}
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Industry
              </label>
              <select {...step2Form.register('industry')} className={selectClass}>
                <option value="">Select industry</option>
                <option value="Fashion">Fashion</option>
                <option value="Apparel">Apparel</option>
                <option value="Footwear">Footwear</option>
                <option value="Accessories">Accessories</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Supplier count */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Supplier count
              </label>
              <select {...step2Form.register('supplierCount')} className={selectClass}>
                <option value="">Select range</option>
                <option value="1-10">1–10</option>
                <option value="11-50">11–50</option>
                <option value="51-200">51–200</option>
                <option value="200+">200+</option>
              </select>
            </div>

            {/* Primary concern */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Primary compliance concern
              </label>
              <select {...step2Form.register('primaryConcern')} className={selectClass}>
                <option value="">Select concern</option>
                <option value="ESPR / DPP">ESPR / DPP</option>
                <option value="Textile EPR">Textile EPR</option>
                <option value="CSRD">CSRD</option>
                <option value="All of the above">All of the above</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={step2Form.formState.isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {step2Form.formState.isSubmitting ? (
                  <>
                    <Spinner />
                    Creating…
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-xs text-slate-400 mt-4">
            You can update these in Settings at any time
          </p>
        </>
      )}
    </div>
  );
}
