import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(helmet());
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
  // Serve uploaded files at GET /uploads/:filename (dev/local only).
  // In production with S3, this directory won't exist — skip if absent.
  const uploadsDir = join(process.cwd(), 'uploads');
  if (fs.existsSync(uploadsDir)) {
    app.useStaticAssets(uploadsDir, { prefix: '/uploads' });
  }
  const port = parseInt(process.env.PORT || '3001', 10);
  // Bind to 0.0.0.0 — required for Railway/Docker container networking
  await app.listen(port, '0.0.0.0');
  console.log(`API running on port ${port}`);
}
bootstrap().catch((err) => {
  console.error('Failed to start API:', err);
  process.exit(1);
});
