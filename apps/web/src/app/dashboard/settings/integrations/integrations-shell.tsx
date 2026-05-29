'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NexaBadge } from '@/components/ui/nexa-badge';
import { NexaButton } from '@/components/ui/nexa-button';
import { useToast } from '@/components/ui/toast-provider';
import { fmtDate } from '@/lib/format';

// ─── Types ──────────────────────────────────────────────────────

interface Webhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  _count: { logs: number };
}

interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface EventGroup {
  label: string;
  events: string[];
}

interface Props {
  webhooks: Webhook[];
  apiKeys: ApiKeyItem[];
  eventGroups: EventGroup[];
}

// ─── Main Shell ─────────────────────────────────────────────────

const TABS = ['webhooks', 'api-keys', 'catalog'] as const;
type Tab = (typeof TABS)[number];

export function IntegrationsShell({ webhooks, apiKeys, eventGroups }: Props) {
  const [tab, setTab] = useState<Tab>('webhooks');

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Integrations</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Connect N.E.X.A Loop to the tools your team already uses.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {t === 'webhooks' ? 'Webhooks' : t === 'api-keys' ? 'API keys' : 'Connectors'}
          </button>
        ))}
      </div>

      {tab === 'webhooks' && <WebhooksTab webhooks={webhooks} eventGroups={eventGroups} />}
      {tab === 'api-keys' && <ApiKeysTab apiKeys={apiKeys} />}
      {tab === 'catalog' && <ConnectorsCatalog />}
    </div>
  );
}

// ─── Webhooks Tab ───────────────────────────────────────────────

function WebhooksTab({ webhooks, eventGroups }: { webhooks: Webhook[]; eventGroups: EventGroup[] }) {
  const router = useRouter();
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  async function toggleWebhook(id: string, currentActive: boolean) {
    setToggling(id);
    try {
      const res = await fetch(`/api/integrations/webhooks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.ok) {
        toast(currentActive ? 'Webhook paused' : 'Webhook activated');
        router.refresh();
      }
    } catch { /* ignore */ }
    setToggling(null);
  }

  async function deleteWebhook(id: string) {
    try {
      const res = await fetch(`/api/integrations/webhooks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Webhook deleted');
        router.refresh();
      }
    } catch { /* ignore */ }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-slate-600">
            Send real-time event notifications to your own endpoints.
          </p>
        </div>
        <NexaButton
          variant="primary"
          icon={<PlusIcon />}
          onClick={() => setShowCreate(true)}
        >
          Add webhook
        </NexaButton>
      </div>

      {showCreate && (
        <CreateWebhookForm
          eventGroups={eventGroups}
          onClose={() => setShowCreate(false)}
        />
      )}

      {webhooks.length === 0 ? (
        <EmptyCard
          title="No webhooks configured"
          sub="Add a webhook to receive event notifications at your endpoint."
        />
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh) => (
            <div
              key={wh.id}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-mono text-slate-800 truncate">{wh.url}</code>
                    <NexaBadge tone={wh.isActive ? 'emerald' : 'slate'} dot>
                      {wh.isActive ? 'Active' : 'Paused'}
                    </NexaBadge>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {wh.events.map((ev) => (
                      <span
                        key={ev}
                        className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-mono rounded"
                      >
                        {ev}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Created {fmtDate(wh.createdAt)} · {wh._count.logs} delivery log{wh._count.logs !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleWebhook(wh.id, wh.isActive)}
                    disabled={toggling === wh.id}
                    className="text-xs font-medium text-slate-500 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50 transition-colors disabled:opacity-50"
                  >
                    {wh.isActive ? 'Pause' : 'Activate'}
                  </button>
                  <button
                    onClick={() => deleteWebhook(wh.id)}
                    className="text-xs font-medium text-slate-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Create Webhook Form ────────────────────────────────────────

function CreateWebhookForm({ eventGroups, onClose }: { eventGroups: EventGroup[]; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  function toggleEvent(event: string) {
    const next = new Set(selectedEvents);
    if (next.has(event)) next.delete(event);
    else next.add(event);
    setSelectedEvents(next);
  }

  function toggleGroup(events: string[]) {
    const allSelected = events.every((e) => selectedEvents.has(e));
    const next = new Set(selectedEvents);
    events.forEach((e) => (allSelected ? next.delete(e) : next.add(e)));
    setSelectedEvents(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedEvents.size === 0) {
      toast('Select at least one event', 'err');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/integrations/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, events: [...selectedEvents] }),
      });
      if (res.ok) {
        toast('Webhook created');
        onClose();
        router.refresh();
      } else {
        toast('Failed to create webhook', 'err');
      }
    } catch {
      toast('Network error', 'err');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-indigo-200 rounded-lg p-5 mb-4 animate-dropdown-enter">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Endpoint URL <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-app.com/webhooks/nexaloop"
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Events <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            {eventGroups.map((group) => {
              const allSelected = group.events.every((e) => selectedEvents.has(e));
              return (
                <div key={group.label}>
                  <label className="flex items-center gap-2 cursor-pointer mb-1.5">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => toggleGroup(group.events)}
                      className="accent-indigo-600 w-3.5 h-3.5"
                    />
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      {group.label}
                    </span>
                  </label>
                  <div className="ml-6 flex flex-wrap gap-2">
                    {group.events.map((ev) => (
                      <label key={ev} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedEvents.has(ev)}
                          onChange={() => toggleEvent(ev)}
                          className="accent-indigo-600 w-3 h-3"
                        />
                        <code className="text-[11px] text-slate-600">{ev}</code>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <NexaButton type="button" variant="secondary" onClick={onClose}>
            Cancel
          </NexaButton>
          <NexaButton type="submit" variant="primary" disabled={saving}>
            {saving ? 'Creating...' : 'Create webhook'}
          </NexaButton>
        </div>
      </form>
    </div>
  );
}

// ─── API Keys Tab ───────────────────────────────────────────────

function ApiKeysTab({ apiKeys }: { apiKeys: ApiKeyItem[] }) {
  const router = useRouter();
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  async function revokeKey(id: string) {
    try {
      const res = await fetch(`/api/integrations/api-keys/${id}/revoke`, { method: 'PUT' });
      if (res.ok) {
        toast('API key revoked');
        router.refresh();
      }
    } catch { /* ignore */ }
  }

  async function createKey(name: string) {
    try {
      const res = await fetch('/api/integrations/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewKey(data.key);
        toast('API key created — copy it now, it won\'t be shown again');
        router.refresh();
      }
    } catch {
      toast('Network error', 'err');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-600">
          Authenticate external applications with API keys.
        </p>
        <NexaButton
          variant="primary"
          icon={<PlusIcon />}
          onClick={() => { setShowCreate(true); setNewKey(null); }}
        >
          Create API key
        </NexaButton>
      </div>

      {showCreate && (
        <CreateApiKeyForm
          onClose={() => setShowCreate(false)}
          onCreate={createKey}
          newKey={newKey}
        />
      )}

      {apiKeys.length === 0 ? (
        <EmptyCard
          title="No API keys"
          sub="Create an API key to access the N.E.X.A Loop API programmatically."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Key prefix</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Last used</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apiKeys.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{k.name}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs text-slate-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                      {k.prefix}...
                    </code>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {k.lastUsedAt ? fmtDate(k.lastUsedAt) : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <NexaBadge tone={k.isActive ? 'emerald' : 'red'} dot>
                      {k.isActive ? 'Active' : 'Revoked'}
                    </NexaBadge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {k.isActive && (
                      <button
                        onClick={() => revokeKey(k.id)}
                        className="text-xs font-medium text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CreateApiKeyForm({
  onClose,
  onCreate,
  newKey,
}: {
  onClose: () => void;
  onCreate: (name: string) => void;
  newKey: string | null;
}) {
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);

  if (newKey) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 mb-4 animate-dropdown-enter">
        <p className="text-sm font-medium text-emerald-800 mb-2">
          Your new API key (copy it now — it won&apos;t be shown again):
        </p>
        <div className="flex gap-2">
          <code className="flex-1 bg-white border border-emerald-200 rounded-md px-3 py-2 text-sm font-mono text-slate-900 break-all">
            {newKey}
          </code>
          <NexaButton
            variant="secondary"
            onClick={() => { navigator.clipboard.writeText(newKey); setCopied(true); }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </NexaButton>
        </div>
        <div className="flex justify-end mt-3">
          <NexaButton variant="secondary" onClick={onClose}>Done</NexaButton>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-indigo-200 rounded-lg p-5 mb-4 animate-dropdown-enter">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Key name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Production, Staging"
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
          />
        </div>
        <NexaButton variant="secondary" onClick={onClose}>Cancel</NexaButton>
        <NexaButton
          variant="primary"
          disabled={!name.trim()}
          onClick={() => onCreate(name)}
        >
          Generate
        </NexaButton>
      </div>
    </div>
  );
}

// ─── Connectors Catalog ─────────────────────────────────────────

const CONNECTORS = [
  {
    category: 'Catalog',
    items: [
      { name: 'Shopify', desc: 'Sync products and SKUs from your storefront', icon: 'S' },
      { name: 'WooCommerce', desc: 'Import product catalog from WordPress', icon: 'W' },
    ],
  },
  {
    category: 'PLM / ERP',
    items: [
      { name: 'Centric PLM', desc: 'Pull product specs and bills of materials', icon: 'C' },
      { name: 'SAP', desc: 'Push compliance status to SAP purchasing module', icon: 'S' },
      { name: 'Sage X3', desc: 'Sync supplier compliance status with ERP', icon: 'X' },
    ],
  },
  {
    category: 'Documents & Communications',
    items: [
      { name: 'DocuSign', desc: 'Send onboarding and NDA agreements to suppliers', icon: 'D' },
      { name: 'Slack', desc: 'Post compliance alerts to a channel', icon: '#' },
      { name: 'Microsoft Teams', desc: 'Post compliance alerts to Teams', icon: 'T' },
    ],
  },
  {
    category: 'Compliance bodies',
    items: [
      { name: 'amfori BSCI', desc: 'Auto-import BSCI audit results from amfori', icon: 'a' },
      { name: 'OEKO-TEX', desc: 'Verify certificates directly with OEKO-TEX', icon: 'O' },
    ],
  },
];

function ConnectorsCatalog() {
  return (
    <div>
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-indigo-900">Connectors are coming soon</p>
            <p className="text-xs text-indigo-700 mt-0.5">
              We&apos;re building native connectors for the tools below. In the meantime, use <strong>Webhooks</strong> and the <strong>REST API</strong> to integrate programmatically.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {CONNECTORS.map((group) => (
          <div key={group.category}>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
              {group.category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {group.items.map((item) => (
                <div
                  key={item.name}
                  className="bg-white border border-slate-200 rounded-lg p-4 flex items-start gap-3"
                >
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-slate-600">{item.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{item.name}</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                        Coming soon
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shared ─────────────────────────────────────────────────────

function EmptyCard({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-12 text-center">
      <div className="w-12 h-12 bg-slate-100 rounded-lg mx-auto mb-4 flex items-center justify-center text-slate-400">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-4.122a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
        </svg>
      </div>
      <p className="text-slate-600 font-medium">{title}</p>
      <p className="text-sm text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
