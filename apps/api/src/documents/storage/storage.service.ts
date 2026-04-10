import { Injectable, Logger } from '@nestjs/common';
import { join, extname } from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client | null;
  private readonly bucket: string;
  private readonly region: string;
  private readonly useS3: boolean;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || '';
    this.region = process.env.AWS_REGION || 'eu-west-1';
    this.useS3 = !!this.bucket;

    if (this.useS3) {
      this.s3 = new S3Client({
        region: this.region,
        // Credentials are resolved from env vars (AWS_ACCESS_KEY_ID,
        // AWS_SECRET_ACCESS_KEY) or IAM roles in production
      });
      this.logger.log(`S3 storage enabled — bucket: ${this.bucket}`);
    } else {
      this.s3 = null;
      this.logger.log('Local file storage enabled (set AWS_S3_BUCKET for S3)');
    }
  }

  /**
   * Saves an uploaded file.
   * - Production (AWS_S3_BUCKET set): uploads to S3
   * - Development (no bucket): saves to local ./uploads/ directory
   *
   * Uses file.mimetype provided by multer (server-detected), never a
   * client-supplied Content-Type value.
   */
  async saveFile(
    file: Express.Multer.File,
  ): Promise<{ fileUrl: string; filename: string; mimeType: string }> {
    const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
    const mimeType = file.mimetype;

    if (this.useS3 && this.s3) {
      return this.saveToS3(file, uniqueName, mimeType);
    }
    return this.saveToLocal(file, uniqueName, mimeType);
  }

  /**
   * Get a pre-signed download URL for an S3 object (15 min expiry).
   * Falls back to the local file URL if S3 is not configured.
   */
  async getDownloadUrl(fileUrl: string): Promise<string> {
    if (!this.useS3 || !this.s3) {
      return fileUrl;
    }

    // fileUrl is stored as "s3://key" in the DB when using S3
    const key = fileUrl.replace('s3://', '');
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.s3, command, { expiresIn: 900 });
  }

  // ── Private ──────────────────────────────────

  private async saveToS3(
    file: Express.Multer.File,
    uniqueName: string,
    mimeType: string,
  ): Promise<{ fileUrl: string; filename: string; mimeType: string }> {
    const key = `documents/${uniqueName}`;

    await this.s3!.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: mimeType,
        ServerSideEncryption: 'AES256',
        Metadata: {
          'original-name': file.originalname,
        },
      }),
    );

    this.logger.log(`Uploaded to S3: ${key}`);

    return {
      fileUrl: `s3://${key}`,
      filename: file.originalname,
      mimeType,
    };
  }

  private async saveToLocal(
    file: Express.Multer.File,
    uniqueName: string,
    mimeType: string,
  ): Promise<{ fileUrl: string; filename: string; mimeType: string }> {
    const uploadsDir = join(process.cwd(), 'uploads');
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    const destPath = join(uploadsDir, uniqueName);
    await fs.promises.writeFile(destPath, file.buffer);

    return {
      fileUrl: `/uploads/${uniqueName}`,
      filename: file.originalname,
      mimeType,
    };
  }
}
