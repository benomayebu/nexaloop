import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { WebhookService } from './webhook.service';
import { ApiKeyService } from './api-key.service';

@Module({
  controllers: [IntegrationsController],
  providers: [WebhookService, ApiKeyService],
  exports: [WebhookService, ApiKeyService],
})
export class IntegrationsModule {}
