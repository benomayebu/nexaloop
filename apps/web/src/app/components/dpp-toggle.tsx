'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props { productId: string; enabled: boolean; }

export function DppToggle({ productId, enabled }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [isEnabled, setIsEnabled] = useState(enabled);

  async function toggle() {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dppEnabled: !isEnabled }),
      });
      if (res.ok) {
        setIsEnabled(!isEnabled);
        router.refresh();
      }
    } catch { /* ignore */ }
    setSaving(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className="flex items-center gap-3 group disabled:opacity-50"
    >
      <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}>
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
      <span className="text-sm text-slate-700 group-hover:text-slate-900 font-medium">
        {saving ? 'Saving...' : isEnabled ? 'DPP Enabled' : 'Enable DPP'}
      </span>
    </button>
  );
}
