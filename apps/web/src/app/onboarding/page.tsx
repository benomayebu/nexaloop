import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

type MeResponse = {
  user: { id: string; email: string; name: string | null };
  org: { id: string; name: string; onboardingComplete: boolean };
  role: string;
};

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

  // OnboardingWizard will be wired in Task 13
  return (
    <div className="min-h-screen flex items-center justify-center"
         style={{ background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 55%, #1e1b4b 100%)' }}>
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <p className="text-slate-500 text-sm text-center">Setting up your onboarding experience…</p>
      </div>
    </div>
  );
}
