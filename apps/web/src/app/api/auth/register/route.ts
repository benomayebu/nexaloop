import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '../../../../lib/api';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const apiRes = await fetch(`${getApiUrl()}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await apiRes.json();

  if (!apiRes.ok) {
    return NextResponse.json(data, { status: apiRes.status });
  }

  const res = NextResponse.json(data);
  res.cookies.set('auth_token', data.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
  return res;
}
