import { apiFetch, apiFetchList } from '../../../lib/api';
import { CrmShell } from './crm-shell';

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

interface PipelineStage {
  id: string;
  label: string;
  tone: string;
}

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

interface PipelineData {
  stages: PipelineStage[];
  cards: PipelineCard[];
}

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

export default async function CrmPage() {
  const [stats, threads, tasks, pipeline, activity, team, suppliers] = await Promise.all([
    apiFetch<CrmStats>('/crm/stats'),
    apiFetchList<Thread>('/crm/threads'),
    apiFetchList<Task>('/crm/tasks'),
    apiFetch<PipelineData>('/crm/pipeline'),
    apiFetchList<ActivityItem>('/crm/activity'),
    apiFetchList<TeamMember>('/crm/team'),
    apiFetchList<SupplierOption>('/suppliers'),
  ]);

  return (
    <CrmShell
      stats={stats ?? { openThreads: 0, openTasks: 0, overdueTasks: 0, pipelineTotal: 0, atRiskCount: 0 }}
      threads={threads}
      tasks={tasks}
      pipeline={pipeline ?? { stages: [], cards: [] }}
      activity={activity}
      team={team}
      suppliers={suppliers.map((s) => ({ id: s.id, name: s.name, type: s.type }))}
    />
  );
}
