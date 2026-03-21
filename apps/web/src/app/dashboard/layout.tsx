import { cookies } from 'next/headers';
import Link from 'next/link';
import { LogoutButton } from '../components/logout-button';

async function getOrgName(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');
  if (!token) return '';

  try {
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(
      `${apiUrl}/auth/me`,
      {
        headers: { Cookie: `auth_token=${token.value}` },
        cache: 'no-store',
      },
    );
    if (!res.ok) return '';
    const data = await res.json();
    return data.org?.name || '';
  } catch (_e) {
    return '';
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orgName = await getOrgName();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-gray-900">N.E.X.A Loop</span>
              {orgName && (
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {orgName}
                </span>
              )}
            </div>
            <nav className="hidden sm:flex items-center gap-4">
              <Link
                href="/dashboard/suppliers"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Suppliers
              </Link>
              <Link
                href="/dashboard/products"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Products
              </Link>
              <Link
                href="/dashboard/settings/document-types"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Settings
              </Link>
            </nav>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
