import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function getApiUrl(): string {
  return process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
}

export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  const apiRes = await fetch(`${getApiUrl()}/onboarding/complete`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `auth_token=${token.value}`,
    },
    body: JSON.stringify(body),
  });

  const data = await apiRes.json();

  if (!apiRes.ok) {
    return NextResponse.json(data, { status: apiRes.status });
  }

  return NextResponse.json(data);
}
