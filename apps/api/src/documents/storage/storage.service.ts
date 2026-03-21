import { Injectable } from '@nestjs/common';
import { join, extname } from 'path';
import * as fs from 'fs';

@Injectable()
export class StorageService {
  /**
   * Saves an uploaded file to the local ./uploads/ directory (dev mode).
   * Uses file.mimetype provided by multer (server-detected), never a
   * client-supplied Content-Type value.
   *
   * In production this should be replaced with an object-storage backend
   * (e.g. AWS S3) — the ./uploads/ directory is not suitable for
   * multi-instance deployments and its contents are publicly readable via
   * the static-asset route.
   */
  async saveFile(
    file: Express.Multer.File,
  ): Promise<{ fileUrl: string; filename: string; mimeType: string }> {
    const uploadsDir = join(process.cwd(), 'uploads');
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
    const destPath = join(uploadsDir, uniqueName);

    await fs.promises.writeFile(destPath, file.buffer);

    return {
      fileUrl: `/uploads/${uniqueName}`,
      filename: file.originalname,
      // Use the server-detected MIME type reported by multer,
      // NOT any value supplied by the client in the request body.
      mimeType: file.mimetype,
    };
  }
}
