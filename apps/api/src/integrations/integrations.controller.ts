import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentOrg } from '../auth/current-org.decorator';
import { WebhookService } from './webhook.service';
import { ApiKeyService } from './api-key.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { WEBHOOK_EVENTS, WEBHOOK_EVENT_GROUPS } from './webhook-events';

@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly apiKeyService: ApiKeyService,
  ) {}

  // ─── Webhook Events Catalog ──────────────────────────────────

  @Get('webhook-events')
  getWebhookEvents() {
    return { events: WEBHOOK_EVENTS, groups: WEBHOOK_EVENT_GROUPS };
  }

  // ─── Webhooks CRUD ───────────────────────────────────────────

  @Get('webhooks')
  listWebhooks(@CurrentOrg() orgId: string) {
    return this.webhookService.list(orgId);
  }

  @Post('webhooks')
  createWebhook(@CurrentOrg() orgId: string, @Body() dto: CreateWebhookDto) {
    return this.webhookService.create(orgId, dto);
  }

  @Put('webhooks/:id')
  updateWebhook(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.webhookService.update(orgId, id, dto);
  }

  @Delete('webhooks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteWebhook(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.webhookService.delete(orgId, id);
  }

  @Get('webhooks/:id/secret')
  getWebhookSecret(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.webhookService.getSecret(orgId, id).then((secret) => ({ secret }));
  }

  @Get('webhooks/:id/logs')
  getWebhookLogs(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.webhookService.getLogs(orgId, id, limit ? parseInt(limit, 10) : 20);
  }

  // ─── API Keys ────────────────────────────────────────────────

  @Get('api-keys')
  listApiKeys(@CurrentOrg() orgId: string) {
    return this.apiKeyService.list(orgId);
  }

  @Post('api-keys')
  createApiKey(@CurrentOrg() orgId: string, @Body() dto: CreateApiKeyDto) {
    return this.apiKeyService.create(orgId, dto);
  }

  @Put('api-keys/:id/revoke')
  revokeApiKey(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.apiKeyService.revoke(orgId, id);
  }
}
