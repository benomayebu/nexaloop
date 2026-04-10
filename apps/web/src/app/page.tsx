import { LandingNav } from '@/app/components/landing/landing-nav';
import { HeroSection } from '@/app/components/landing/hero-section';
import { TrustBar } from '@/app/components/landing/trust-bar';
import { ProblemSection } from '@/app/components/landing/problem-section';
import { SolutionTabs } from '@/app/components/landing/solution-tabs';
import { HowItWorksSection } from '@/app/components/landing/how-it-works';
import { RegulatorySection } from '@/app/components/landing/regulatory-section';
import { EarlyAccessSection } from '@/app/components/landing/early-access-section';
import { PricingSection } from '@/app/components/landing/pricing-section';
import { SiteFooter } from '@/app/components/landing/site-footer';
import { MobileCTABar } from '@/app/components/landing/mobile-cta-bar';

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
        <EarlyAccessSection />
        <PricingSection />
      </main>
      <SiteFooter />
      <MobileCTABar />
    </>
  );
}
