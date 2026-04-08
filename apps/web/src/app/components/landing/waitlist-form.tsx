'use client';

import { useForm } from 'react-hook-form';

type WaitlistData = {
  email: string;
  company: string;
  supplierCount: string;
};

export function WaitlistForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    setError,
  } = useForm<WaitlistData>();

  const onSubmit = async (data: WaitlistData) => {
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        setError('root', { message: 'Something went wrong. Please try again.' });
      }
    } catch {
      setError('root', { message: 'Network error. Please try again.' });
    }
  };

  if (isSubmitSuccessful) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="text-white font-display font-bold text-lg mb-1">Application received</p>
        <p className="text-indigo-200 text-sm">We review every application personally. You'll hear back within 3 business days.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {errors.root && (
        <p className="text-red-300 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
          {errors.root.message}
        </p>
      )}

      <div>
        <input
          type="email"
          placeholder="Work email address"
          {...register('email', { required: 'Email is required' })}
          className="w-full bg-white/10 border border-white/20 text-white placeholder:text-indigo-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
        />
        {errors.email && <p className="text-red-300 text-xs mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <input
          type="text"
          placeholder="Company name"
          {...register('company', { required: 'Company name is required' })}
          className="w-full bg-white/10 border border-white/20 text-white placeholder:text-indigo-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
        />
        {errors.company && <p className="text-red-300 text-xs mt-1">{errors.company.message}</p>}
      </div>

      <div>
        <select
          {...register('supplierCount', { required: 'Please select a range' })}
          defaultValue=""
          className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors appearance-none"
        >
          <option value="" disabled className="text-slate-900">How many suppliers do you work with?</option>
          <option value="lt10" className="text-slate-900">Less than 10</option>
          <option value="10-50" className="text-slate-900">10–50</option>
          <option value="50-200" className="text-slate-900">50–200</option>
          <option value="200+" className="text-slate-900">200+</option>
        </select>
        {errors.supplierCount && (
          <p className="text-red-300 text-xs mt-1">{errors.supplierCount.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-indigo-500 hover:bg-indigo-400 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-lg text-sm transition-all duration-150 flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting...
          </>
        ) : (
          'Apply for early access'
        )}
      </button>

      <p className="text-indigo-300/60 text-xs text-center pt-1">
        We review every application personally. You will hear back within 3 business days.
      </p>
    </form>
  );
}
