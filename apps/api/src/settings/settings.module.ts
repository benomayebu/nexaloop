import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { EmailService } from '../notifications/email.service';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, EmailService],
})
export class SettingsModule {}
