import { Module } from '@nestjs/common';
import { DppController } from './dpp.controller';
import { DppService } from './dpp.service';

@Module({
  controllers: [DppController],
  providers: [DppService],
})
export class DppModule {}
