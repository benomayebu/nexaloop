import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'path';
import * as fs from 'fs';

// ── Startup environment validation ─────────────────────────────────
function validateEnv() {
  const logger = new Logger('Bootstrap');
  const required: [string, string][] = [
    ['DATABASE_URL', 'PostgreSQL connection string'],
    ['JWT_SECRET', 'JWT signing key'],
  ];
  const missing: string[] = [];
  for (const [key, desc] of required) {
    if (!process.env[key]) {
      missing.push(`  ${key} — ${desc}`);
    }
  }
  if (missing.length > 0) {
    logger.error(
      `Missing required environment variables:\n${missing.join('\n')}\n` +
        'Copy .env.example to .env and fill in the values.',
    );
    process.exit(1);
  }
  // Warn if using the default insecure JWT secret
  if (
    process.env.JWT_SECRET === 'REPLACE_THIS_BEFORE_RUNNING_DO_NOT_USE_DEFAULT' ||
    process.env.JWT_SECRET === 'nexaloop-jwt-secret-change-in-production'
  ) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('JWT_SECRET is set to a default value. Generate a secure secret for production.');
      process.exit(1);
    }
    logger.warn('JWT_SECRET is using a default value — acceptable for development only.');
  }
}

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

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

  // ── Graceful shutdown ──────────────────────────────────────────────
  app.enableShutdownHooks();

  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal} — shutting down gracefully...`);
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  const port = parseInt(process.env.PORT || '3001', 10);
  // Bind to 0.0.0.0 — required for Railway/Docker container networking
  await app.listen(port, '0.0.0.0');
  logger.log(`API running on port ${port} (${process.env.NODE_ENV ?? 'development'})`);
}

bootstrap().catch((err) => {
  console.error('Failed to start API:', err);
  process.exit(1);
});
