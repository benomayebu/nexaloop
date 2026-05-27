'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast-provider';

export function CancelInviteButton({ inviteId }: { inviteId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    if (!confirm('Cancel this invitation?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/settings/team/invites/${inviteId}`, { method: 'DELETE' });
      if (!res.ok) {
        toast('Failed to cancel invitation');
        return;
      }
      toast('Invitation cancelled');
      router.refresh();
    } catch {
      toast('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      title="Cancel invitation"
      className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

export function ResendInviteButton({ inviteId }: { inviteId: string }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    setLoading(true);
    try {
      const res = await fetch(`/api/settings/team/invites/${inviteId}/resend`, { method: 'POST' });
      if (!res.ok) {
        toast('Failed to resend invitation');
        return;
      }
      toast('Invitation resent');
    } catch {
      toast('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleResend}
      disabled={loading}
      title="Resend invitation"
      className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
      </svg>
    </button>
  );
}
