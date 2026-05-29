import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class ApiKeyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a new API key for an org.
   * Returns the raw key ONCE — it is only stored as a hash.
   */
  async create(orgId: string, data: { name: string; expiresAt?: string }) {
    const rawKey = `nxa_${randomBytes(32).toString('hex')}`;
    const prefix = rawKey.slice(0, 12); // "nxa_" + 8 hex chars
    const keyHash = createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await this.prisma.apiKey.create({
      data: {
        orgId,
        name: data.name,
        keyHash,
        prefix,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });

    // Return the raw key only on creation
    return {
      id: apiKey.id,
      name: apiKey.name,
      prefix: apiKey.prefix,
      key: rawKey, // shown once, never stored
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }

  async list(orgId: string) {
    return this.prisma.apiKey.findMany({
      where: { orgId },
      select: {
        id: true,
        name: true,
        prefix: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(orgId: string, id: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id, orgId },
    });
    if (!key) return null;

    return this.prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Validate an API key from a request header.
   * Returns the orgId if valid, null otherwise.
   */
  async validate(rawKey: string): Promise<string | null> {
    const keyHash = createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await this.prisma.apiKey.findFirst({
      where: {
        keyHash,
        isActive: true,
      },
    });

    if (!apiKey) return null;

    // Check expiry
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return null;
    }

    // Update last used timestamp (fire-and-forget)
    this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => { /* non-critical */ });

    return apiKey.orgId;
  }
}
