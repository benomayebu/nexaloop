/**
 * Defines the canonical set of webhook events that N.E.X.A Loop can emit.
 * Each event name follows the pattern: entity.action
 */
export const WEBHOOK_EVENTS = [
  // Suppliers
  'supplier.created',
  'supplier.updated',
  'supplier.deleted',

  // Documents
  'document.uploaded',
  'document.reviewed',
  'document.expired',

  // Products
  'product.created',
  'product.updated',

  // CRM
  'thread.created',
  'thread.resolved',
  'task.created',
  'task.completed',

  // Compliance
  'compliance.score_changed',
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

/** Group events by domain for the UI */
export const WEBHOOK_EVENT_GROUPS = [
  {
    label: 'Suppliers',
    events: ['supplier.created', 'supplier.updated', 'supplier.deleted'] as const,
  },
  {
    label: 'Documents',
    events: ['document.uploaded', 'document.reviewed', 'document.expired'] as const,
  },
  {
    label: 'Products',
    events: ['product.created', 'product.updated'] as const,
  },
  {
    label: 'CRM',
    events: ['thread.created', 'thread.resolved', 'task.created', 'task.completed'] as const,
  },
  {
    label: 'Compliance',
    events: ['compliance.score_changed'] as const,
  },
];
