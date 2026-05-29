import { IntegrationsShell } from './integrations-shell';
import { apiFetch } from '@/lib/api';

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

interface EventsData {
  events: string[];
  groups: { label: string; events: string[] }[];
}

export default async function IntegrationsSettingsPage() {
  const [webhooks, apiKeys, eventsData] = await Promise.all([
    apiFetch<Webhook[]>('/integrations/webhooks'),
    apiFetch<ApiKeyItem[]>('/integrations/api-keys'),
    apiFetch<EventsData>('/integrations/webhook-events'),
  ]);

  return (
    <IntegrationsShell
      webhooks={webhooks ?? []}
      apiKeys={apiKeys ?? []}
      eventGroups={eventsData?.groups ?? []}
    />
  );
}
