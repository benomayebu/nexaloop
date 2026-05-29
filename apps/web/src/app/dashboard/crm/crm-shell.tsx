'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { NexaBadge } from '@/components/ui/nexa-badge';
import { NexaButton } from '@/components/ui/nexa-button';
import { SupAvatar } from '@/components/ui/sup-avatar';
import { ScoreBar } from '@/components/ui/score-bar';
import { riskBadge } from '@/lib/badges';
import { fmtDate, relativeDays, initials } from '@/lib/format';
import { useToast } from '@/components/ui/toast-provider';

// ─── Types ──────────────────────────────────────────────────────────

interface CrmStats {
  openThreads: number;
  openTasks: number;
  overdueTasks: number;
  pipelineTotal: number;
  atRiskCount: number;
}

interface Thread {
  id: string;
  subject: string;
  status: string;
  lastMessageAt: string;
  supplier: { id: string; name: string; type: string } | null;
  contact: { id: string; name: string; role: string } | null;
  createdBy: { id: string; name: string } | null;
  _count: { messages: number };
  messages: { body: string; authorName: string; createdAt: string }[];
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string;
  completedAt: string | null;
  supplier: { id: string; name: string; type: string } | null;
  document: { id: string; filename: string; status: string } | null;
  assignee: { id: string; name: string; email: string } | null;
}

interface PipelineStage { id: string; label: string; tone: string }
interface PipelineCard {
  id: string;
  name: string;
  supplierCode: string | null;
  type: string;
  country: string;
  city: string | null;
  status: string;
  riskLevel: string;
  stage: string;
  complianceScore: number | null;
  _count: { documents: number; contacts: number; productLinks: number };
}
interface PipelineData { stages: PipelineStage[]; cards: PipelineCard[] }

interface ActivityItem {
  id: string;
  kind: string;
  subject: string;
  detail: string;
  entityType: string | null;
  entityId: string | null;
  ts: string;
}

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface SupplierOption {
  id: string;
  name: string;
  type: string;
}

interface CrmShellProps {
  stats: CrmStats;
  threads: Thread[];
  tasks: Task[];
  pipeline: PipelineData;
  activity: ActivityItem[];
  team: TeamMember[];
  suppliers: SupplierOption[];
}

// ─── Main Shell ─────────────────────────────────────────────────────

const TABS = ['inbox', 'pipeline', 'tasks', 'activity'] as const;
type Tab = (typeof TABS)[number];

export function CrmShell({ stats, threads, tasks, pipeline, activity, team, suppliers }: CrmShellProps) {
  const [tab, setTab] = useState<Tab>('inbox');
  const [showNewThread, setShowNewThread] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CRM</h1>
          <p className="text-sm text-slate-500 mt-1">
            Conversations, pipeline and tasks across your supplier network.
          </p>
        </div>
        <div className="flex gap-2">
          <NexaButton variant="secondary" icon={<PlusIcon />} onClick={() => setShowNewThread(true)}>New thread</NexaButton>
          <NexaButton variant="primary" icon={<PlusIcon />} onClick={() => setShowNewTask(true)}>New task</NexaButton>
        </div>
      </div>

      {showNewThread && <NewThreadModal suppliers={suppliers} onClose={() => setShowNewThread(false)} />}
      {showNewTask && <NewTaskModal suppliers={suppliers} team={team} onClose={() => setShowNewTask(false)} />}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<MailIcon />} label="Open threads" value={stats.openThreads} sub={`${threads.length} total`} />
        <StatCard icon={<CheckIcon />} label="Open tasks" value={stats.openTasks} sub={stats.overdueTasks > 0 ? `${stats.overdueTasks} overdue` : 'All on track'} subTone={stats.overdueTasks > 0 ? 'red' : 'emerald'} />
        <StatCard icon={<TruckIcon />} label="Pipeline" value={stats.pipelineTotal} sub={`${pipeline.cards.filter(c => c.stage === 'ACTIVE').length} active`} />
        <StatCard icon={<AlertIcon />} label="At-risk suppliers" value={stats.atRiskCount} sub={stats.atRiskCount > 0 ? 'Needs attention' : 'All clear'} subTone={stats.atRiskCount > 0 ? 'red' : 'emerald'} />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {TABS.map((t) => {
          const count = t === 'inbox' ? threads.filter(th => th.status === 'OPEN').length
            : t === 'tasks' ? tasks.filter(tk => tk.status === 'OPEN').length
            : t === 'pipeline' ? pipeline.cards.length
            : null;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {count != null && count > 0 && (
                <span className="ml-1.5 text-[11px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'inbox' && <InboxTab threads={threads} />}
      {tab === 'pipeline' && <PipelineTab pipeline={pipeline} />}
      {tab === 'tasks' && <TasksTab tasks={tasks} team={team} />}
      {tab === 'activity' && <ActivityTab activity={activity} />}
    </div>
  );
}

// ─── Inbox Tab ──────────────────────────────────────────────────────

function InboxTab({ threads }: { threads: Thread[] }) {
  const router = useRouter();
  const toast = useToast();
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);

  async function toggleResolve(threadId: string, currentStatus: string) {
    const endpoint = currentStatus === 'OPEN' ? 'resolve' : 'reopen';
    try {
      const res = await fetch(`/api/crm/threads/${threadId}/${endpoint}`, { method: 'PUT' });
      if (res.ok) {
        toast(endpoint === 'resolve' ? 'Thread resolved' : 'Thread reopened');
        router.refresh();
      }
    } catch { /* ignore */ }
  }

  async function sendReply(threadId: string) {
    if (!replyBody.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/crm/threads/${threadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyBody }),
      });
      if (res.ok) {
        toast('Reply sent');
        setReplyBody('');
        router.refresh();
      } else {
        toast('Failed to send reply', 'err');
      }
    } catch {
      toast('Network error', 'err');
    } finally {
      setSending(false);
    }
  }

  const filtered = threads.filter((t) => {
    if (filter === 'open') return t.status === 'OPEN';
    if (filter === 'resolved') return t.status === 'RESOLVED';
    return true;
  });

  if (threads.length === 0) {
    return (
      <EmptyState icon={<MailIcon />} title="No conversations yet" subtitle="Start a thread to track discussions with supplier contacts." />
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterChip>
        <FilterChip active={filter === 'open'} onClick={() => setFilter('open')}>Open</FilterChip>
        <FilterChip active={filter === 'resolved'} onClick={() => setFilter('resolved')}>Resolved</FilterChip>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm divide-y divide-slate-100">
        {filtered.map((thread) => {
          const lastMsg = thread.messages[0];
          const isExpanded = expandedId === thread.id;
          return (
            <div key={thread.id}>
              <div
                className={`flex items-start gap-3 p-4 cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/40' : 'hover:bg-slate-50'}`}
                onClick={() => { setExpandedId(isExpanded ? null : thread.id); setReplyBody(''); }}
              >
                {thread.supplier && (
                  <SupAvatar name={thread.supplier.name} type={thread.supplier.type} size="sm" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {thread.supplier && (
                      <Link
                        href={`/dashboard/suppliers/${thread.supplier.id}`}
                        className="text-sm font-medium text-slate-900 hover:text-indigo-600 truncate"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {thread.supplier.name}
                      </Link>
                    )}
                    <span className="text-xs text-slate-400 font-mono flex-shrink-0">{fmtDate(thread.lastMessageAt)}</span>
                  </div>
                  <p className="text-sm text-slate-700 truncate">{thread.subject}</p>
                  {!isExpanded && lastMsg && (
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {lastMsg.authorName}: {lastMsg.body.slice(0, 80)}{lastMsg.body.length > 80 ? '…' : ''}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <NexaBadge tone={thread.status === 'OPEN' ? 'indigo' : 'slate'} dot>
                      {thread.status === 'OPEN' ? 'Open' : 'Resolved'}
                    </NexaBadge>
                    {thread.contact && (
                      <span className="text-[11px] text-slate-400">{thread.contact.name}</span>
                    )}
                    <span className="text-[11px] text-slate-400">{thread._count.messages} message{thread._count.messages !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleResolve(thread.id, thread.status); }}
                    className="text-xs font-medium text-slate-500 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                    title={thread.status === 'OPEN' ? 'Mark as resolved' : 'Reopen'}
                  >
                    {thread.status === 'OPEN' ? 'Resolve' : 'Reopen'}
                  </button>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>

              {/* Expanded thread detail */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 animate-dropdown-enter">
                  {/* Message history */}
                  <div className="px-5 py-3 space-y-3 max-h-64 overflow-y-auto">
                    {thread.messages.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2">No messages yet.</p>
                    ) : (
                      [...thread.messages].reverse().map((msg, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-[10px] font-semibold text-indigo-700">
                              {initials(msg.authorName)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-800">{msg.authorName}</span>
                              <span className="text-[11px] text-slate-400 font-mono">{fmtDate(msg.createdAt)}</span>
                            </div>
                            <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-line">{msg.body}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Reply composer */}
                  {thread.status === 'OPEN' && (
                    <div className="px-5 py-3 border-t border-slate-200 bg-white">
                      <div className="flex gap-2">
                        <textarea
                          value={replyBody}
                          onChange={(e) => setReplyBody(e.target.value)}
                          placeholder="Write a reply..."
                          rows={2}
                          className="flex-1 border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none bg-white"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <NexaButton
                          variant="primary"
                          size="sm"
                          disabled={sending || !replyBody.trim()}
                          onClick={(e: React.MouseEvent) => { e.stopPropagation(); sendReply(thread.id); }}
                        >
                          {sending ? 'Sending...' : 'Send'}
                        </NexaButton>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Pipeline Tab ───────────────────────────────────────────────────

function PipelineTab({ pipeline }: { pipeline: PipelineData }) {
  const { stages, cards } = pipeline;
  const byStage = (stageId: string) => cards.filter((c) => c.stage === stageId);

  if (cards.length === 0) {
    return (
      <EmptyState icon={<TruckIcon />} title="No suppliers in pipeline" subtitle="Add suppliers to start tracking your supply chain relationships." />
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(240px, 1fr))`, minWidth: stages.length * 260 }}>
        {stages.map((stage) => {
          const items = byStage(stage.id);
          return (
            <div key={stage.id} className="bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200">
                <NexaBadge tone={stage.tone as 'emerald' | 'amber' | 'red' | 'indigo' | 'slate'} dot>{stage.label}</NexaBadge>
                <span className="text-xs font-mono text-slate-500">{items.length}</span>
              </div>
              <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
                {items.map((card) => {
                  const risk = riskBadge(card.riskLevel);
                  return (
                    <Link
                      key={card.id}
                      href={`/dashboard/suppliers/${card.id}`}
                      className="block bg-white rounded-md border border-slate-200 p-3 hover:shadow-sm hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <SupAvatar name={card.name} type={card.type} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-slate-900 truncate">{card.name}</p>
                          {card.supplierCode && (
                            <p className="text-[11px] font-mono text-slate-500">{card.supplierCode}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span>{card.city ? `${card.city}, ` : ''}{card.country}</span>
                        <span>{card._count.documents} doc{card._count.documents !== 1 ? 's' : ''}</span>
                      </div>
                      {card.complianceScore !== null && (
                        <div className="mb-2">
                          <ScoreBar value={card.complianceScore} />
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <NexaBadge tone={risk.tone}>{risk.label}</NexaBadge>
                        <span className="text-[11px] text-slate-400">{card._count.productLinks} product{card._count.productLinks !== 1 ? 's' : ''}</span>
                      </div>
                    </Link>
                  );
                })}
                {items.length === 0 && (
                  <p className="text-center text-xs text-slate-400 py-6">No suppliers</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tasks Tab ──────────────────────────────────────────────────────

function TasksTab({ tasks, team: _team }: { tasks: Task[]; team: TeamMember[] }) {
  const router = useRouter();
  const toast = useToast();
  const [filter, setFilter] = useState<'all' | 'open' | 'overdue' | 'done'>('all');
  const [showDone, setShowDone] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const now = new Date();

  async function toggleTask(taskId: string, currentStatus: string) {
    setToggling(taskId);
    const newStatus = currentStatus === 'DONE' ? 'OPEN' : 'DONE';
    try {
      const res = await fetch(`/api/crm/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast(newStatus === 'DONE' ? 'Task completed' : 'Task reopened');
        router.refresh();
      }
    } catch { /* ignore */ }
    setToggling(null);
  }

  const filtered = tasks.filter((t) => {
    if (filter === 'open') return t.status === 'OPEN';
    if (filter === 'overdue') return t.status === 'OPEN' && new Date(t.dueDate) < now;
    if (filter === 'done') return t.status === 'DONE';
    return showDone || t.status !== 'DONE';
  });

  const overdue = filtered.filter((t) => t.status === 'OPEN' && new Date(t.dueDate) < now);
  const thisWeek = filtered.filter((t) => {
    if (t.status !== 'OPEN') return false;
    const due = new Date(t.dueDate);
    const weekFromNow = new Date(now);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return due >= now && due <= weekFromNow;
  });
  const later = filtered.filter((t) => {
    if (t.status !== 'OPEN') return false;
    const due = new Date(t.dueDate);
    const weekFromNow = new Date(now);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return due > weekFromNow;
  });
  const done = filtered.filter((t) => t.status === 'DONE');

  if (tasks.length === 0) {
    return (
      <EmptyState icon={<CheckIcon />} title="No tasks yet" subtitle="Create tasks to track compliance to-dos across your supplier network." />
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterChip>
        <FilterChip active={filter === 'open'} onClick={() => setFilter('open')}>Open</FilterChip>
        <FilterChip active={filter === 'overdue'} onClick={() => setFilter('overdue')}>Overdue</FilterChip>
        <label className="ml-auto inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showDone}
            onChange={(e) => setShowDone(e.target.checked)}
            className="accent-indigo-600 w-3.5 h-3.5"
          />
          Show completed
        </label>
      </div>

      <TaskSection title="Overdue" tone="red" items={overdue} onToggle={toggleTask} toggling={toggling} />
      <TaskSection title="This week" tone="amber" items={thisWeek} onToggle={toggleTask} toggling={toggling} />
      <TaskSection title="Coming up" tone="indigo" items={later} onToggle={toggleTask} toggling={toggling} />
      {showDone && <TaskSection title="Completed" tone="emerald" items={done} onToggle={toggleTask} toggling={toggling} />}

      {filtered.length === 0 && (
        <EmptyState icon={<CheckIcon />} title="Inbox zero" subtitle="You're all caught up." />
      )}
    </div>
  );
}

function TaskSection({ title, tone, items, onToggle, toggling }: { title: string; tone: string; items: Task[]; onToggle: (id: string, status: string) => void; toggling: string | null }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <NexaBadge tone={tone as 'emerald' | 'amber' | 'red' | 'indigo' | 'slate'} dot>{title}</NexaBadge>
        <span className="text-xs font-mono text-slate-500">{items.length}</span>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full">
          <tbody className="divide-y divide-slate-100">
            {items.map((task) => {
              const priorityBadge = task.priority === 'HIGH'
                ? { tone: 'red' as const, label: 'High' }
                : task.priority === 'MEDIUM'
                ? { tone: 'amber' as const, label: 'Medium' }
                : { tone: 'slate' as const, label: 'Low' };
              return (
                <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                  <td className="pl-4 py-3 w-10">
                    <button
                      onClick={() => onToggle(task.id, task.status)}
                      disabled={toggling === task.id}
                      className={`w-4 h-4 rounded border-2 ${task.status === 'DONE' ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 hover:border-indigo-400'} flex items-center justify-center transition-colors disabled:opacity-50`}
                    >
                      {task.status === 'DONE' && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-sm ${task.status === 'DONE' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {task.title}
                    </span>
                  </td>
                  <td className="px-3 py-3 w-48">
                    {task.supplier ? (
                      <div className="flex items-center gap-2">
                        <SupAvatar name={task.supplier.name} type={task.supplier.type} size="sm" />
                        <Link href={`/dashboard/suppliers/${task.supplier.id}`} className="text-xs text-slate-600 hover:text-indigo-600 truncate">
                          {task.supplier.name}
                        </Link>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 w-24">
                    <NexaBadge tone={priorityBadge.tone} dot>{priorityBadge.label}</NexaBadge>
                  </td>
                  <td className="px-3 py-3 w-32">
                    <span className={`text-xs font-medium ${
                      task.status === 'DONE' ? 'text-slate-400'
                      : new Date(task.dueDate) < new Date() ? 'text-red-600'
                      : new Date(task.dueDate) < new Date(Date.now() + 3 * 86400000) ? 'text-amber-600'
                      : 'text-slate-500'
                    }`}>
                      {relativeDays(task.dueDate)}
                    </span>
                  </td>
                  <td className="px-3 py-3 w-16">
                    {task.assignee && (
                      <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center" title={task.assignee.name ?? task.assignee.email}>
                        <span className="text-[10px] font-semibold text-indigo-700">{initials(task.assignee.name ?? task.assignee.email)}</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Activity Tab ───────────────────────────────────────────────────

function ActivityTab({ activity }: { activity: ActivityItem[] }) {
  if (activity.length === 0) {
    return (
      <EmptyState icon={<ClockIcon />} title="No activity yet" subtitle="Actions across your supplier network will appear here." />
    );
  }

  const kindIcon = (kind: string) => {
    switch (kind) {
      case 'message': return <MailIcon />;
      case 'doc': return <FileIcon />;
      case 'task': return <CheckIcon />;
      default: return <TruckIcon />;
    }
  };

  const kindColor = (kind: string) => {
    switch (kind) {
      case 'message': return 'text-indigo-600 bg-indigo-50';
      case 'doc': return 'text-emerald-600 bg-emerald-50';
      case 'task': return 'text-amber-600 bg-amber-50';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="px-5 py-4 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">Recent activity</h3>
        <p className="text-xs text-slate-500 mt-0.5">All actions across your supplier network</p>
      </div>
      <div className="divide-y divide-slate-100">
        {activity.map((item) => (
          <div key={item.id} className="flex items-start gap-3 px-5 py-3.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${kindColor(item.kind)}`}>
              <span className="w-4 h-4">{kindIcon(item.kind)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-slate-900">{item.subject}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {item.detail} &middot; {fmtDate(item.ts)}
              </p>
            </div>
            <NexaBadge tone="slate">{item.kind}</NexaBadge>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shared UI ──────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, subTone }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  subTone?: 'red' | 'emerald';
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center gap-2 text-slate-500 mb-2">
        <span className="w-4 h-4">{icon}</span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums animate-count-up">{value}</p>
      <p className={`text-xs mt-1 ${subTone === 'red' ? 'text-red-600' : subTone === 'emerald' ? 'text-emerald-600' : 'text-slate-500'}`}>
        {sub}
      </p>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
        active
          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-12 text-center">
      <div className="w-12 h-12 bg-slate-100 rounded-lg mx-auto mb-4 flex items-center justify-center text-slate-400">
        <span className="w-6 h-6">{icon}</span>
      </div>
      <p className="text-slate-600 font-medium">{title}</p>
      <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
    </div>
  );
}

// ─── New Thread Modal ───────────────────────────────────────────────

function NewThreadModal({ suppliers, onClose }: { suppliers: SupplierOption[]; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ subject: '', supplierId: '', body: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/crm/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: form.subject,
          supplierId: form.supplierId || undefined,
          body: form.body,
        }),
      });
      if (!res.ok) {
        toast('Failed to create thread', 'err');
        return;
      }
      toast('Thread created');
      onClose();
      router.refresh();
    } catch {
      toast('Network error', 'err');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="New thread" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Subject" required>
          <input
            required
            type="text"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className={inputClass}
            placeholder="e.g. BSCI renewal — facility audit"
          />
        </Field>
        <Field label="Supplier">
          <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className={inputClass}>
            <option value="">None (general)</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Message" required>
          <textarea
            required
            rows={4}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className={inputClass}
            placeholder="Start the conversation..."
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <NexaButton type="button" variant="secondary" onClick={onClose}>Cancel</NexaButton>
          <NexaButton type="submit" variant="primary" disabled={saving}>
            {saving ? 'Creating...' : 'Create thread'}
          </NexaButton>
        </div>
      </form>
    </Modal>
  );
}

// ─── New Task Modal ─────────────────────────────────────────────────

function NewTaskModal({ suppliers, team, onClose }: { suppliers: SupplierOption[]; team: TeamMember[]; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 7);
  const [form, setForm] = useState({
    title: '',
    description: '',
    supplierId: '',
    assigneeId: team[0]?.id ?? '',
    priority: 'MEDIUM',
    dueDate: defaultDue.toISOString().slice(0, 10),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/crm/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          supplierId: form.supplierId || undefined,
          assigneeId: form.assigneeId,
          priority: form.priority,
          dueDate: new Date(form.dueDate).toISOString(),
        }),
      });
      if (!res.ok) {
        toast('Failed to create task', 'err');
        return;
      }
      toast('Task created');
      onClose();
      router.refresh();
    } catch {
      toast('Network error', 'err');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="New task" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Title" required>
          <input
            required
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={inputClass}
            placeholder="e.g. Review BSCI corrective action plan"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Supplier">
            <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className={inputClass}>
              <option value="">None</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Assign to" required>
            <select required value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })} className={inputClass}>
              {team.map((m) => <option key={m.id} value={m.id}>{m.name ?? m.email}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Priority">
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={inputClass}>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </Field>
          <Field label="Due date" required>
            <input
              required
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={inputClass}
            placeholder="Additional details..."
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <NexaButton type="button" variant="secondary" onClick={onClose}>Cancel</NexaButton>
          <NexaButton type="submit" variant="primary" disabled={saving}>
            {saving ? 'Creating...' : 'Create task'}
          </NexaButton>
        </div>
      </form>
    </Modal>
  );
}

// ─── Modal + Field primitives ───────────────────────────────────────

const inputClass = 'w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white';

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg mx-4 p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Inline Icons ───────────────────────────────────────────────────

const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function PlusIcon() { return <svg viewBox="0 0 24 24" className="w-4 h-4" {...s}><path d="M12 4.5v15m7.5-7.5h-15" /></svg>; }
function MailIcon() { return <svg viewBox="0 0 24 24" className="w-full h-full" {...s}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" /></svg>; }
function CheckIcon() { return <svg viewBox="0 0 24 24" className="w-full h-full" {...s}><path d="M20 6L9 17l-5-5" /></svg>; }
function TruckIcon() { return <svg viewBox="0 0 24 24" className="w-full h-full" {...s}><path d="M1 7h13v10H1z" /><path d="M14 10h5l3 3v4h-8" /><circle cx="6" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>; }
function AlertIcon() { return <svg viewBox="0 0 24 24" className="w-full h-full" {...s}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><path d="M12 9v4M12 17h.01" /></svg>; }
function FileIcon() { return <svg viewBox="0 0 24 24" className="w-full h-full" {...s}><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" /><path d="M14 3v6h6" /></svg>; }
function ClockIcon() { return <svg viewBox="0 0 24 24" className="w-full h-full" {...s}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>; }
