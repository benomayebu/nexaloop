'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ChangeMemberRoleButton({
  memberId,
  currentRole,
  roles,
}: {
  memberId: string;
  currentRole: string;
  roles: string[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value;
    if (newRole === currentRole) return;
    setLoading(true);
    try {
      await fetch(`/api/settings/team/${memberId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      defaultValue={currentRole}
      onChange={handleChange}
      disabled={loading}
      className="border border-slate-200 rounded-md px-2 py-1 text-xs font-medium text-slate-700 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
    >
      {roles.map((r) => (
        <option key={r} value={r}>{r}</option>
      ))}
    </select>
  );
}
