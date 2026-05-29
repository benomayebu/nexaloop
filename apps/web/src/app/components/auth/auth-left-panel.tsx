'use client';

// Dark left panel for the auth shell.
// Renders the brand mark, orbital supply-chain SVG, context-aware
// tagline + description, and trust/trial footer badges.

import { usePathname } from 'next/navigation';
import { LoopMark } from '@/components/shell/loop-mark';
import { AuthVisual } from './auth-visual';

const COPY = {
  login: {
    headline: 'The compliance backbone for EU-facing fashion brands.',
    highlightFrom: 'EU-facing fashion brands.',
    body: 'Centralise supplier data. Track every certificate. Ship ESPR Digital Product Passports in one click.',
    footer: 'ESPR / EPR / REACH ready  ·  SOC 2 Type II  ·  EU-hosted',
  },
  register: {
    headline: 'Set up your workspace in under 2 minutes.',
    highlightFrom: 'in under 2 minutes.',
    body: 'Invite your supply chain team, import suppliers from a CSV, and start tracking compliance documents today.',
    footer: '14-day trial  ·  No credit card  ·  Cancel anytime',
  },
};

export function AuthLeftPanel() {
  const pathname = usePathname();
  const variant = pathname.startsWith('/register') ? 'register' : 'login';
  const copy = COPY[variant];

  // Split headline at the highlight portion
  const idx = copy.headline.indexOf(copy.highlightFrom);
  const before = copy.headline.slice(0, idx);
  const highlight = copy.highlightFrom;

  return (
    <div className="hidden md:flex md:w-[44%] flex-col justify-between bg-slate-900 px-10 py-10 relative overflow-hidden">
      {/* Brand */}
      <div className="relative z-10 flex items-center gap-2.5">
        <LoopMark size={28} />
        <span className="text-[15px] font-bold text-white tracking-tight">
          N.E.X.A Loop
        </span>
      </div>

      {/* Orbital visualisation */}
      <div className="relative z-10 flex-1 flex items-center justify-center py-8">
        <AuthVisual />
      </div>

      {/* Tagline + description */}
      <div className="relative z-10 space-y-3">
        <p className="text-lg font-semibold text-white leading-snug">
          {before}
          <span className="text-indigo-300">{highlight}</span>
        </p>
        <p className="text-sm text-slate-400 leading-relaxed">
          {copy.body}
        </p>
      </div>

      {/* Footer badges */}
      <div className="relative z-10 mt-6">
        <p className="text-xs text-slate-500 font-mono tracking-wide">
          {copy.footer}
        </p>
      </div>
    </div>
  );
}
