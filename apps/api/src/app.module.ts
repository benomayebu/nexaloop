import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { DocumentTypesModule } from './document-types/document-types.module';
import { DocumentsModule } from './documents/documents.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    SuppliersModule,
    DocumentTypesModule,
    DocumentsModule,
    ProductsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
