import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrmThreadStatus, CrmTaskStatus } from '@prisma/client';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Stats ────────────────────────────────────────────────────────

  async stats(orgId: string) {
    const now = new Date();

    const [
      openThreads,
      openTasks,
      overdueTasks,
      pipelineCounts,
      atRiskCount,
    ] = await Promise.all([
      this.prisma.crmThread.count({
        where: { orgId, status: 'OPEN' },
      }),
      this.prisma.crmTask.count({
        where: { orgId, status: 'OPEN' },
      }),
      this.prisma.crmTask.count({
        where: { orgId, status: 'OPEN', dueDate: { lt: now } },
      }),
      this.prisma.supplier.groupBy({
        by: ['status'],
        where: { orgId },
        _count: true,
      }),
      this.prisma.supplier.count({
        where: { orgId, riskLevel: 'HIGH' },
      }),
    ]);

    const pipelineTotal = pipelineCounts.reduce((sum, g) => sum + g._count, 0);

    return {
      openThreads,
      openTasks,
      overdueTasks,
      pipelineTotal,
      atRiskCount,
    };
  }

  // ─── Threads ──────────────────────────────────────────────────────

  async listThreads(
    orgId: string,
    filters: { status?: CrmThreadStatus; supplierId?: string },
  ) {
    return this.prisma.crmThread.findMany({
      where: {
        orgId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.supplierId ? { supplierId: filters.supplierId } : {}),
      },
      include: {
        supplier: { select: { id: true, name: true, type: true } },
        contact: { select: { id: true, name: true, role: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { messages: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { body: true, authorName: true, createdAt: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async getThread(orgId: string, threadId: string) {
    const thread = await this.prisma.crmThread.findFirst({
      where: { id: threadId, orgId },
      include: {
        supplier: { select: { id: true, name: true, type: true, country: true } },
        contact: { select: { id: true, name: true, email: true, role: true } },
        createdBy: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            authorType: true,
            authorName: true,
            authorUserId: true,
            body: true,
            createdAt: true,
          },
        },
      },
    });
    if (!thread) throw new NotFoundException('Thread not found');
    return thread;
  }

  async createThread(orgId: string, userId: string, dto: CreateThreadDto) {
    if (dto.supplierId) {
      await this.verifySupplierAccess(orgId, dto.supplierId);
    }

    return this.prisma.crmThread.create({
      data: {
        orgId,
        subject: dto.subject,
        supplierId: dto.supplierId,
        contactId: dto.contactId,
        createdByUserId: userId,
        messages: {
          create: {
            authorType: 'INTERNAL',
            authorName: 'You',
            authorUserId: userId,
            body: dto.body,
          },
        },
      },
      include: {
        supplier: { select: { id: true, name: true, type: true } },
        messages: true,
      },
    });
  }

  async addMessage(
    orgId: string,
    userId: string,
    threadId: string,
    dto: CreateMessageDto,
  ) {
    const thread = await this.prisma.crmThread.findFirst({
      where: { id: threadId, orgId },
    });
    if (!thread) throw new NotFoundException('Thread not found');

    const [message] = await this.prisma.$transaction([
      this.prisma.crmMessage.create({
        data: {
          threadId,
          authorType: dto.authorType,
          authorName: dto.authorName,
          authorUserId: dto.authorType === 'INTERNAL' ? userId : dto.authorUserId,
          body: dto.body,
        },
      }),
      this.prisma.crmThread.update({
        where: { id: threadId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    return message;
  }

  async resolveThread(orgId: string, threadId: string) {
    const thread = await this.prisma.crmThread.findFirst({
      where: { id: threadId, orgId },
    });
    if (!thread) throw new NotFoundException('Thread not found');
    return this.prisma.crmThread.update({
      where: { id: threadId },
      data: { status: 'RESOLVED' },
    });
  }

  async reopenThread(orgId: string, threadId: string) {
    const thread = await this.prisma.crmThread.findFirst({
      where: { id: threadId, orgId },
    });
    if (!thread) throw new NotFoundException('Thread not found');
    return this.prisma.crmThread.update({
      where: { id: threadId },
      data: { status: 'OPEN' },
    });
  }

  // ─── Tasks ────────────────────────────────────────────────────────

  async listTasks(
    orgId: string,
    filters: { status?: CrmTaskStatus; assigneeId?: string; supplierId?: string },
  ) {
    return this.prisma.crmTask.findMany({
      where: {
        orgId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
        ...(filters.supplierId ? { supplierId: filters.supplierId } : {}),
      },
      include: {
        supplier: { select: { id: true, name: true, type: true } },
        document: { select: { id: true, filename: true, status: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    });
  }

  async createTask(orgId: string, dto: CreateTaskDto) {
    if (dto.supplierId) {
      await this.verifySupplierAccess(orgId, dto.supplierId);
    }

    return this.prisma.crmTask.create({
      data: {
        orgId,
        title: dto.title,
        description: dto.description,
        supplierId: dto.supplierId,
        documentId: dto.documentId,
        assigneeId: dto.assigneeId,
        priority: dto.priority,
        dueDate: new Date(dto.dueDate),
      },
      include: {
        supplier: { select: { id: true, name: true, type: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async updateTask(orgId: string, taskId: string, dto: UpdateTaskDto) {
    const task = await this.prisma.crmTask.findFirst({
      where: { id: taskId, orgId },
    });
    if (!task) throw new NotFoundException('Task not found');

    return this.prisma.crmTask.update({
      where: { id: taskId },
      data: {
        title: dto.title,
        description: dto.description,
        supplierId: dto.supplierId,
        documentId: dto.documentId,
        assigneeId: dto.assigneeId,
        priority: dto.priority,
        status: dto.status,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        completedAt: dto.status === 'DONE' ? new Date() : dto.status === 'OPEN' ? null : undefined,
      },
      include: {
        supplier: { select: { id: true, name: true, type: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async deleteTask(orgId: string, taskId: string) {
    const task = await this.prisma.crmTask.findFirst({
      where: { id: taskId, orgId },
    });
    if (!task) throw new NotFoundException('Task not found');
    await this.prisma.crmTask.delete({ where: { id: taskId } });
  }

  // ─── Pipeline ─────────────────────────────────────────────────────

  async pipeline(orgId: string) {
    const suppliers = await this.prisma.supplier.findMany({
      where: { orgId },
      include: {
        documents: {
          where: { orgId },
          select: { status: true },
        },
        _count: { select: { documents: true, contacts: true, productLinks: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const stages = [
      { id: 'PROSPECT', label: 'Prospect', tone: 'slate' },
      { id: 'VETTING', label: 'Vetting', tone: 'indigo' },
      { id: 'ONBOARDING', label: 'Onboarding', tone: 'amber' },
      { id: 'ACTIVE', label: 'Active', tone: 'emerald' },
      { id: 'AT_RISK', label: 'At risk', tone: 'red' },
    ];

    const cards = suppliers.map((sup) => {
      const docs = sup.documents;
      const approved = docs.filter((d) => d.status === 'APPROVED').length;
      const total = docs.length;
      const complianceScore = total > 0 ? Math.round((approved / total) * 100) : null;

      const stage =
        sup.riskLevel === 'HIGH' && sup.status === 'ACTIVE'
          ? 'AT_RISK'
          : sup.status;

      const { documents: _docs, ...rest } = sup;
      return { ...rest, stage, complianceScore };
    });

    return { stages, cards };
  }

  // ─── Activity ─────────────────────────────────────────────────────

  async activity(orgId: string, limit = 30) {
    const [notifications, recentTasks, recentThreads] = await Promise.all([
      this.prisma.notification.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          entityType: true,
          entityId: true,
          createdAt: true,
        },
      }),
      this.prisma.crmTask.findMany({
        where: { orgId, status: 'DONE' },
        orderBy: { completedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          completedAt: true,
          assignee: { select: { name: true } },
          supplier: { select: { id: true, name: true } },
        },
      }),
      this.prisma.crmThread.findMany({
        where: { orgId },
        orderBy: { lastMessageAt: 'desc' },
        take: 10,
        select: {
          id: true,
          subject: true,
          lastMessageAt: true,
          createdBy: { select: { name: true } },
          supplier: { select: { id: true, name: true } },
        },
      }),
    ]);

    const items = [
      ...notifications.map((n) => ({
        id: n.id,
        kind: n.type.startsWith('DOCUMENT') ? 'doc' : 'system',
        subject: n.title,
        detail: n.message,
        entityType: n.entityType,
        entityId: n.entityId,
        ts: n.createdAt,
      })),
      ...recentTasks.map((t) => ({
        id: `task_${t.id}`,
        kind: 'task' as const,
        subject: `Completed: ${t.title}`,
        detail: t.assignee?.name ?? 'Unknown',
        entityType: t.supplier ? 'supplier' : null,
        entityId: t.supplier?.id ?? null,
        ts: t.completedAt ?? new Date(),
      })),
      ...recentThreads.map((th) => ({
        id: `thread_${th.id}`,
        kind: 'message' as const,
        subject: th.subject,
        detail: th.createdBy?.name ?? 'Unknown',
        entityType: th.supplier ? 'supplier' : null,
        entityId: th.supplier?.id ?? null,
        ts: th.lastMessageAt,
      })),
    ];

    items.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
    return items.slice(0, limit);
  }

  // ─── Team members (for assignee dropdowns) ────────────────────────

  async teamMembers(orgId: string) {
    const members = await this.prisma.userOrganization.findMany({
      where: { organizationId: orgId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
    }));
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  private async verifySupplierAccess(orgId: string, supplierId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, orgId },
    });
    if (!supplier) throw new ForbiddenException('Supplier not found or access denied');
  }
}
