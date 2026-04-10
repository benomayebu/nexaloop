import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // TODO: persist to WaitlistEntry model when DB table is ready
  // For now: log the submission and return success
  const body = await request.json();
  console.log('[waitlist] application received:', body);
  return NextResponse.json({ ok: true }, { status: 200 });
}
