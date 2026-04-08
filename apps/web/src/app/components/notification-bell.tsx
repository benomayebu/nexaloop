'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function typeIcon(type: string) {
  switch (type) {
    case 'DOCUMENT_EXPIRING':
      return <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />;
    case 'DOCUMENT_EXPIRED':
      return <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />;
    case 'DOCUMENT_UPLOADED':
    case 'DOCUMENT_REVIEWED':
      return <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />;
    default:
      return <span className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />;
  }
}

function entityLink(entityType: string | null, entityId: string | null): string | null {
  if (!entityType || !entityId) return null;
  if (entityType === 'document') return `/dashboard/suppliers`;
  if (entityType === 'supplier') return `/dashboard/suppliers/${entityId}`;
  if (entityType === 'product') return `/dashboard/products/${entityId}`;
  return null;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications/count`);
      if (res.ok) {
        const data = await res.json();
        setCount(data.count);
      }
    } catch { /* ignore */ }
  }, []);

  // Poll every 30 seconds
  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleOpen() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?unread=false`);
      if (res.ok) setNotifications(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function markAllRead() {
    try {
      await fetch(`/api/notifications/read-all`, { method: 'PATCH' });
      setCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* ignore */ }
  }

  async function markRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setCount((c) => Math.max(0, c - 1));
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch { /* ignore */ }
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={handleOpen} className="relative text-slate-400 hover:text-slate-600 transition-colors">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
            {count > 0 && (
              <button onClick={markAllRead} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-slate-400">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">No notifications yet</div>
            ) : (
              notifications.map((n) => {
                const link = entityLink(n.entityType, n.entityId);
                const content = (
                  <div
                    className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 transition-colors ${
                      !n.read ? 'bg-indigo-50/50' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => !n.read && markRead(n.id)}
                  >
                    <div className="mt-1.5">{typeIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                );

                return link ? (
                  <Link key={n.id} href={link} onClick={() => setOpen(false)}>
                    {content}
                  </Link>
                ) : (
                  <div key={n.id}>{content}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
