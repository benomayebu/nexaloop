import Link from 'next/link';
import { apiFetchList } from '../../../lib/api';
import { MarkAllReadButton } from '../../components/mark-all-read-button';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
}

function typeDot(type: string): { dot: string; unreadBg: string } {
  switch (type) {
    case 'DOCUMENT_EXPIRING':  return { dot: 'bg-amber-400', unreadBg: 'bg-amber-50/60' };
    case 'DOCUMENT_EXPIRED':   return { dot: 'bg-red-500',   unreadBg: 'bg-red-50/60' };
    case 'DOCUMENT_UPLOADED':
    case 'DOCUMENT_REVIEWED':  return { dot: 'bg-indigo-500', unreadBg: 'bg-indigo-50/60' };
    default:                   return { dot: 'bg-slate-400',  unreadBg: '' };
  }
}

function entityHref(entityType: string | null, entityId: string | null): string | null {
  if (!entityType || !entityId) return null;
  if (entityType === 'supplier') return `/dashboard/suppliers/${entityId}`;
  if (entityType === 'product')  return `/dashboard/products/${entityId}`;
  if (entityType === 'document') return `/dashboard/suppliers`;
  return null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatTypeLabel(type: string): string {
  return type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

function NotificationRow({ n }: { n: Notification }) {
  const { dot, unreadBg } = typeDot(n.type);
  const href = entityHref(n.entityType, n.entityId);

  const inner = (
    <div className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-slate-50 ${!n.read ? unreadBg : ''}`}>
      <span className={`mt-2 w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`text-sm ${!n.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
              {n.title}
            </p>
            <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
          </div>
          <div className="flex-shrink-0 text-right space-y-1">
            <p className="text-xs text-slate-400 whitespace-nowrap">{formatDate(n.createdAt)}</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
              {formatTypeLabel(n.type)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (href) return <Link href={href} className="block">{inner}</Link>;
  return <div>{inner}</div>;
}

export default async function NotificationsPage() {
  const notifications = await apiFetchList<Notification>('/notifications?unread=false');

  const unread = notifications.filter((n) => !n.read);
  const read   = notifications.filter((n) => n.read);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            {unread.length > 0 ? `${unread.length} unread` : 'All caught up'}
          </p>
        </div>
        {unread.length > 0 && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-16 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-600">No notifications yet</p>
          <p className="text-xs text-slate-400 mt-1">
            You&apos;ll be notified about document expirations and compliance events.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {unread.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Unread ({unread.length})
              </h2>
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm divide-y divide-slate-100 overflow-hidden">
                {unread.map((n) => <NotificationRow key={n.id} n={n} />)}
              </div>
            </section>
          )}

          {read.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Earlier
              </h2>
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm divide-y divide-slate-100 overflow-hidden">
                {read.map((n) => <NotificationRow key={n.id} n={n} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
