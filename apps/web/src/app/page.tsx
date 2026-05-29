import type { Metadata } from 'next';
import { LandingNav } from '@/app/components/landing/landing-nav';
import { HeroSection } from '@/app/components/landing/hero-section';
import { TrustBar } from '@/app/components/landing/trust-bar';
import { ProblemSection } from '@/app/components/landing/problem-section';
import { SolutionTabs } from '@/app/components/landing/solution-tabs';
import { HowItWorksSection } from '@/app/components/landing/how-it-works';
import { RegulatorySection } from '@/app/components/landing/regulatory-section';
import { EprCalculatorCTA } from '@/app/components/landing/epr-calculator-cta';
import { BlogPreviewSection } from '@/app/components/landing/blog-preview-section';
import { EarlyAccessSection } from '@/app/components/landing/early-access-section';
import { PricingSection } from '@/app/components/landing/pricing-section';
import { SiteFooter } from '@/app/components/landing/site-footer';
import { MobileCTABar } from '@/app/components/landing/mobile-cta-bar';

export const metadata: Metadata = {
  title: 'N.E.X.A Loop — EU Supply Chain Compliance for Fashion Brands',
  description:
    'Centralise supplier data, track compliance documents, and generate ESPR Digital Product Passports. Built for EU-facing fashion brands navigating ESPR, EPR, and REACH regulations.',
  openGraph: {
    title: 'N.E.X.A Loop — Know where your products come from. Prove it.',
    description:
      'Supply chain compliance platform for EU-facing fashion brands. ESPR, DPP, and EPR ready.',
    type: 'website',
    url: 'https://nexaloop.vercel.app',
    siteName: 'N.E.X.A Loop',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'N.E.X.A Loop — EU Supply Chain Compliance',
    description: 'Centralise supplier data. Track every certificate. Ship Digital Product Passports in one click.',
  },
  alternates: {
    canonical: 'https://nexaloop.vercel.app',
  },
};

export default function HomePage() {
  return (
    <>
      <LandingNav />
      <main>
        <HeroSection />
        <TrustBar />
        <ProblemSection />
        <SolutionTabs />
        <HowItWorksSection />
        <RegulatorySection />
        <EprCalculatorCTA />
        <BlogPreviewSection />
        <EarlyAccessSection />
        <PricingSection />
      </main>
      <SiteFooter />
      <MobileCTABar />
    </>
  );
}
