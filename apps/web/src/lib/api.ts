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
  const result = await apiFetch<T[] | { data: T[] }>(path, init);
  if (!result) return [];
  // Handle both array and paginated { data } responses
  if (Array.isArray(result)) return result;
  if ('data' in result && Array.isArray(result.data)) return result.data;
  return [];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export async function apiFetchPaginated<T>(path: string, init?: RequestInit): Promise<PaginatedResponse<T>> {
  const result = await apiFetch<PaginatedResponse<T>>(path, init);
  return result ?? { data: [], total: 0, page: 1, pageSize: 50 };
}
