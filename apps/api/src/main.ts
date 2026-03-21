import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: process.env.WEB_URL || 'http://localhost:3000',
    credentials: true,
  });
  // Serve uploaded files at GET /uploads/:filename.
  // Note: in production this should be replaced with object storage (e.g. S3)
  // so that the uploads directory is not publicly readable on the server.
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`API running on port ${port}`);
}
bootstrap();
