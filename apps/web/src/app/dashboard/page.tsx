import { cookies } from 'next/headers';
import Link from 'next/link';

async function getMeData() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');
  if (!token) return null;

  try {
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(
      `${apiUrl}/auth/me`,
      {
        headers: { Cookie: `auth_token=${token.value}` },
        cache: 'no-store',
      },
    );
    if (!res.ok) return null;
    return res.json();
  } catch (_e) {
    return null;
  }
}

export default async function DashboardPage() {
  const data = await getMeData();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Welcome to {data?.org?.name || 'your organization'}
      </h1>
      <p className="mt-2 text-gray-600">
        Supply chain compliance &amp; traceability platform.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/suppliers" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-medium text-gray-900">Suppliers</h3>
          <p className="mt-2 text-sm text-gray-500">Manage your supplier network</p>
        </Link>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Compliance</h3>
          <p className="mt-2 text-sm text-gray-500">Track compliance requirements</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Traceability</h3>
          <p className="mt-2 text-sm text-gray-500">End-to-end supply chain visibility</p>
        </div>
      </div>
    </div>
  );
}
