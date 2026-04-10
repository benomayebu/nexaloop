// apps/web/src/app/onboarding/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { OnboardingWizard } from '../components/onboarding/onboarding-wizard';
import type { MeResponse } from '../components/onboarding/types';

async function getMe(): Promise<MeResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');
  if (!token) return null;

  try {
    const apiUrl =
      process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/auth/me`, {
      headers: { Cookie: `auth_token=${token.value}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function OnboardingPage() {
  const me = await getMe();

  if (!me) {
    redirect('/login');
  }

  if (me.org.onboardingComplete) {
    redirect('/dashboard');
  }

  return <OnboardingWizard me={me} />;
}
