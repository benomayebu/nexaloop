import type { Metadata } from 'next';
import { EprCalculatorShell } from './epr-calculator-shell';

export const metadata: Metadata = {
  title: 'Free EU EPR Fee Calculator | N.E.X.A Loop',
  description:
    'Calculate your annual Refashion textile EPR eco-contribution fees in minutes. Free, no account needed. Covers 80+ official product lines with eco-modulation adjustments.',
  openGraph: {
    title: 'Free EU EPR Fee Calculator | N.E.X.A Loop',
    description:
      'Calculate your annual Refashion textile EPR eco-contribution fees in minutes. Free, no account needed. Covers 80+ product lines.',
    siteName: 'N.E.X.A Loop',
  },
};

export default function EprCalculatorPage() {
  return <EprCalculatorShell />;
}
