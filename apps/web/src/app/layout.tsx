import type { Metadata } from 'next';
import { DM_Sans, DM_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'N.E.X.A Loop — EU Supply Chain Compliance Platform',
  description:
    'Complete supply chain visibility, document control, and regulatory readiness for EU-facing fashion brands. Built for ESPR, DPP, and EPR compliance.',
  openGraph: {
    title: 'N.E.X.A Loop',
    description: 'Know exactly where your products come from. Prove it.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${dmMono.variable} font-sans antialiased text-body`}
        style={{ fontFeatureSettings: "'ss01' on, 'ss02' on" }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
