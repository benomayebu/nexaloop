import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHmac, randomBytes } from 'crypto';
import { WebhookEvent } from './webhook-events';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── CRUD ──────────────────────────────────────────────────────

  async list(orgId: string) {
    return this.prisma.webhook.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { logs: true } },
      },
    });
  }

  async create(orgId: string, data: { url: string; events: string[] }) {
    const secret = `whsec_${randomBytes(24).toString('hex')}`;
    return this.prisma.webhook.create({
      data: {
        orgId,
        url: data.url,
        events: data.events,
        secret,
      },
    });
  }

  async update(orgId: string, id: string, data: { url?: string; events?: string[]; isActive?: boolean }) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, orgId },
    });
    if (!webhook) return null;

    return this.prisma.webhook.update({
      where: { id },
      data,
    });
  }

  async delete(orgId: string, id: string) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, orgId },
    });
    if (!webhook) return null;

    await this.prisma.webhook.delete({ where: { id } });
    return true;
  }

  async getSecret(orgId: string, id: string) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, orgId },
      select: { secret: true },
    });
    return webhook?.secret ?? null;
  }

  async getLogs(orgId: string, webhookId: string, limit = 20) {
    // Verify ownership
    const webhook = await this.prisma.webhook.findFirst({
      where: { id: webhookId, orgId },
      select: { id: true },
    });
    if (!webhook) return [];

    return this.prisma.webhookLog.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ─── Event Dispatch ────────────────────────────────────────────

  /**
   * Fire a webhook event for a given org.
   * Finds all active webhooks subscribed to this event and delivers payloads.
   * Runs asynchronously — callers don't need to await delivery.
   *
   * Must NEVER throw: callers invoke this fire-and-forget, so a rejection
   * here becomes an unhandled rejection and kills the process.
   */
  async dispatch(orgId: string, event: WebhookEvent, payload: Record<string, unknown>) {
    try {
      const webhooks = await this.prisma.webhook.findMany({
        where: {
          orgId,
          isActive: true,
          events: { has: event },
        },
      });

      if (webhooks.length === 0) return;

      const envelope = {
        event,
        timestamp: new Date().toISOString(),
        data: payload,
      };
      const body = JSON.stringify(envelope);

      // Fire all webhooks in parallel, don't block the caller
      const deliveries = webhooks.map((wh) => this.deliver(wh.id, wh.url, wh.secret, event, body));

      // Don't await — fire and forget; deliver() handles its own errors
      void Promise.allSettled(deliveries);
    } catch (err) {
      this.logger.error(`Webhook dispatch failed for event ${event}`, err);
    }
  }

  private async deliver(webhookId: string, url: string, secret: string, event: string, body: string) {
    const signature = createHmac('sha256', secret).update(body).digest('hex');
    let statusCode: number | null = null;
    let success = false;
    let error: string | null = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-NexaLoop-Event': event,
          'X-NexaLoop-Signature': `sha256=${signature}`,
          'X-NexaLoop-Timestamp': new Date().toISOString(),
          'User-Agent': 'NexaLoop-Webhook/1.0',
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      statusCode = res.status;
      success = res.status >= 200 && res.status < 300;

      if (!success) {
        error = `HTTP ${res.status}`;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      this.logger.warn(`Webhook delivery failed: ${url} — ${error}`);
    }

    // Log the attempt
    try {
      await this.prisma.webhookLog.create({
        data: {
          webhookId,
          event,
          statusCode,
          success,
          payload: body,
          error,
        },
      });
    } catch (logErr) {
      this.logger.error(`Failed to log webhook delivery`, logErr);
    }
  }
}
