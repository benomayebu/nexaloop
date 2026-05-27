'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/toast-provider';

interface NotifPref {
  email: boolean;
  inApp: boolean;
}

const EVENTS = [
  { key: 'expiringDocs', label: 'Expiring documents', desc: 'When a compliance document is approaching its expiry date' },
  { key: 'pendingReview', label: 'Pending review queue', desc: 'When suppliers upload new documents needing approval' },
  { key: 'docRejected', label: 'Document rejected', desc: 'When a document you submitted is rejected' },
  { key: 'newSupplierMsg', label: 'New supplier messages', desc: 'When a supplier replies to a CRM thread' },
  { key: 'weeklyReport', label: 'Weekly compliance digest', desc: 'Summary of compliance posture, expirations, and at-risk suppliers' },
  { key: 'productPublished', label: 'Product/DPP published', desc: 'When a Digital Product Passport is published' },
  { key: 'teamMentions', label: 'Team mentions', desc: 'When a teammate mentions you in a thread or note' },
] as const;

type EventKey = typeof EVENTS[number]['key'];

const DEFAULTS: Record<EventKey, NotifPref> = {
  expiringDocs: { email: true, inApp: true },
  pendingReview: { email: false, inApp: true },
  docRejected: { email: true, inApp: true },
  newSupplierMsg: { email: true, inApp: true },
  weeklyReport: { email: true, inApp: false },
  productPublished: { email: false, inApp: true },
  teamMentions: { email: true, inApp: true },
};

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        on ? 'bg-indigo-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          on ? 'translate-x-[18px]' : 'translate-x-[2px]'
        }`}
      />
    </button>
  );
}

export default function NotificationsSettingsPage() {
  const toast = useToast();
  const [prefs, setPrefs] = useState<Record<EventKey, NotifPref>>(DEFAULTS);
  const [saving, setSaving] = useState(false);

  function updatePref(key: EventKey, channel: 'email' | 'inApp', value: boolean) {
    setPrefs((prev) => ({
      ...prev,
      [key]: { ...prev[key], [channel]: value },
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/notification-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      if (res.ok) {
        toast('Notification preferences saved');
      } else {
        toast('Could not save preferences — backend support coming soon');
      }
    } catch {
      toast('Could not save preferences — backend support coming soon');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
        <p className="text-sm text-slate-500 mt-0.5">Choose how you want to be notified about key events.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Event</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-20">Email</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-20">In-app</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {EVENTS.map((evt) => (
                <tr key={evt.key} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-900">{evt.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{evt.desc}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle on={prefs[evt.key].email} onChange={(v) => updatePref(evt.key, 'email', v)} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle on={prefs[evt.key].inApp} onChange={(v) => updatePref(evt.key, 'inApp', v)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save preferences'}
          </button>
        </div>
      </div>

      {/* Quiet hours */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Quiet hours</h3>
        <p className="text-xs text-slate-500 mb-3">Pause non-critical notifications during these hours.</p>
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex flex-wrap items-center gap-3">
          <Toggle on={true} onChange={() => {}} />
          <span className="text-sm text-slate-600">From</span>
          <select className="border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" defaultValue="20:00">
            <option>18:00</option><option>19:00</option><option>20:00</option><option>21:00</option><option>22:00</option>
          </select>
          <span className="text-sm text-slate-600">to</span>
          <select className="border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" defaultValue="08:00">
            <option>06:00</option><option>07:00</option><option>08:00</option><option>09:00</option>
          </select>
          <span className="text-xs text-slate-400">Local time</span>
        </div>
      </div>
    </div>
  );
}
