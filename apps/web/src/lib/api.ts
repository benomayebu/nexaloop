import { cookies } from 'next/headers';

export function getApiUrl() {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');
  if (!token) return null;

  try {
    const res = await fetch(`${getApiUrl()}${path}`, {
      ...init,
      headers: {
        ...init?.headers,
        Cookie: `auth_token=${token.value}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function apiFetchList<T>(path: string, init?: RequestInit): Promise<T[]> {
  const result = await apiFetch<T[]>(path, init);
  return result ?? [];
}
