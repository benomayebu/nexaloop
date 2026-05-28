import type { Metadata } from 'next';
import { EprCalculatorShell } from './epr-calculator-shell';

export const metadata: Metadata = {
  title: 'Free EU EPR Fee Calculator | N.E.X.A Loop',
  description:
    'Calculate your quarterly Refashion textile EPR eco-contribution fees in minutes. Free, no account needed. Covers 15 material categories with eco-modulation adjustments.',
  openGraph: {
    title: 'Free EU EPR Fee Calculator | N.E.X.A Loop',
    description:
      'Calculate your quarterly Refashion textile EPR eco-contribution fees in minutes. Free, no account needed.',
    siteName: 'N.E.X.A Loop',
  },
};

export default function EprCalculatorPage() {
  return <EprCalculatorShell />;
}
