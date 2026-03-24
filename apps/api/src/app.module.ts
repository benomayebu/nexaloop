import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { DocumentTypesModule } from './document-types/document-types.module';
import { DocumentsModule } from './documents/documents.module';
import { ProductsModule } from './products/products.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DppModule } from './dpp/dpp.module';
import { EprModule } from './epr/epr.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    SuppliersModule,
    DocumentTypesModule,
    DocumentsModule,
    ProductsModule,
    DashboardModule,
    NotificationsModule,
    DppModule,
    EprModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
