import { Module } from '@nestjs/common';
import { EprController } from './epr.controller';
import { EprService } from './epr.service';

@Module({
  controllers: [EprController],
  providers: [EprService],
})
export class EprModule {}
