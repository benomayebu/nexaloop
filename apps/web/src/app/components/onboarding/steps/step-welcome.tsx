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

const BULLETS = [
  { icon: '🎯', text: 'Confirm your compliance focus' },
  { icon: '🏭', text: 'Add your first supplier' },
  { icon: '✅', text: 'Start tracking compliance' },
];

export function StepWelcome({ me, onNext }: Props) {
  const displayName = me.user.name || me.org.name;

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
        <div className="h-1 flex-1 bg-slate-200 rounded-full" />
        <div className="h-1 flex-1 bg-slate-200 rounded-full" />
        <div className="h-1 flex-1 bg-slate-200 rounded-full" />
      </div>

      {/* Greeting */}
      <div className="text-4xl mb-4">👋</div>
      <h1 className="font-display text-2xl font-black text-slate-900 mb-2">
        Welcome, {displayName}.
      </h1>
      <p className="text-sm text-slate-500 mb-8">
        Let&apos;s get{' '}
        <span className="text-indigo-600 font-semibold">{me.org.name}</span>{' '}
        set up for EU compliance. Takes about 2 minutes.
      </p>

      {/* Setup bullets */}
      <ul className="space-y-3 mb-8">
        {BULLETS.map(({ icon, text }) => (
          <li key={text} className="flex items-center gap-3 text-sm text-slate-600">
            <span className="w-7 h-7 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0 text-base">
              {icon}
            </span>
            {text}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={onNext}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
      >
        Let&apos;s get started →
      </button>
    </motion.div>
  );
}
