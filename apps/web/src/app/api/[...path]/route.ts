/**
 * Catch-all API proxy (senior-architect + security-engineer)
 *
 * Problem: after the auth-proxy fix, `auth_token` lives on the Vercel domain.
 * Client components cannot send it to Railway (different domain).
 *
 * Solution: every client-side fetch goes to /api/<path> on the same Vercel
 * origin. This route reads the httpOnly cookie server-side and forwards it
 * to Railway as a Cookie header, then streams the response back.
 *
 * Security:
 * - Cookie is read server-side only — never exposed to client JS
 * - Specific /api/auth/* routes take precedence over this catch-all
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function getApiUrl(): string {
  return process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
}

async function proxyRequest(
  req: NextRequest,
  params: { path: string[] },
): Promise<NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');

  const path = params.path.join('/');
  const search = req.nextUrl.search;
  const url = `${getApiUrl()}/${path}${search}`;

  const headers: Record<string, string> = {};

  const contentType = req.headers.get('content-type');
  if (contentType) headers['content-type'] = contentType;

  if (token) {
    headers['cookie'] = `auth_token=${token.value}`;
  }

  const method = req.method;
  const body = method !== 'GET' && method !== 'HEAD'
    ? await req.blob()
    : undefined;

  try {
    const apiRes = await fetch(url, { method, headers, body });
    const resContentType = apiRes.headers.get('content-type') ?? 'application/json';
    const resBody = await apiRes.blob();

    return new NextResponse(resBody, {
      status: apiRes.status,
      headers: { 'content-type': resContentType },
    });
  } catch {
    return NextResponse.json({ message: 'API unreachable' }, { status: 503 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(req, await params);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(req, await params);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(req, await params);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(req, await params);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(req, await params);
}
