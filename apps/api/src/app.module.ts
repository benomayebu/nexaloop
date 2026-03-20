import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SuppliersModule } from './suppliers/suppliers.module';

@Module({
  imports: [PrismaModule, AuthModule, SuppliersModule],
  controllers: [AppController],
})
export class AppModule {}
