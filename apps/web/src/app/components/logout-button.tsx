'use client';

import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/logout`,
        {
          method: 'POST',
          credentials: 'include',
        },
      );
    } catch {
      // If the API call fails we still redirect — the cookie will expire naturally
    } finally {
      router.push('/login');
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
    >
      Logout
    </button>
  );
}
