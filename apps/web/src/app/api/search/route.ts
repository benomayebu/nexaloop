import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');

  if (!token) {
    return NextResponse.json({ suppliers: [], products: [], documents: [] });
  }

  const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(q)}`, {
    headers: { Cookie: `auth_token=${token.value}` },
  });

  if (!res.ok) {
    return NextResponse.json({ suppliers: [], products: [], documents: [] });
  }

  return NextResponse.json(await res.json());
}
