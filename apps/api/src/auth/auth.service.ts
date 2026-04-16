import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Optional() private readonly emailService: EmailService,
  ) {}

  private sanitizeUser(user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
    updatedAt: Date;
    passwordHash: string;
  }) {
    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  async register(
    email: string,
    password: string,
    orgName: string,
    name?: string,
    industry?: string,
    supplierCount?: string,
    primaryConcern?: string,
  ) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const org = await tx.organization.create({
        data: { name: orgName, industry, supplierCount, primaryConcern },
      });

      const user = await tx.user.create({
        data: { email, passwordHash, name },
      });

      await tx.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          role: 'OWNER',
        },
      });

      return { user, org };
    });

    const token = this.jwtService.sign({
      sub: result.user.id,
      email: result.user.email,
      orgId: result.org.id,
    });

    return { token, user: this.sanitizeUser(result.user), org: result.org };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const membership = await this.prisma.userOrganization.findFirst({
      where: { userId: user.id },
      include: { organization: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!membership) {
      throw new UnauthorizedException('No organization found');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      orgId: membership.organizationId,
    });

    return { token, user: this.sanitizeUser(user), org: membership.organization };
  }

  // ── Password reset ───────────────────────────────────────────────

  /**
   * Always returns void — never leaks whether an email exists (prevents enumeration).
   * Rate limiting is enforced at the controller level.
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true },
    });

    // Silent no-op if user doesn't exist — caller always gets 200
    if (!user) return;

    // Invalidate any existing un-used tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Generate 256-bit random token; store its SHA-256 hash
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const webUrl = process.env.WEB_URL || 'http://localhost:3000';
    const resetUrl = `${webUrl}/reset-password?token=${rawToken}`;

    // Fire-and-forget — if email fails the user can request again
    this.emailService?.sendPasswordReset(user.email, resetUrl).catch(() => void 0);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();

    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
      select: { id: true, userId: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired password reset link');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Atomically update the password and mark the token as used
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: now },
      }),
    ]);
  }

  async getMe(userId: string, orgId: string) {
    const membership = await this.prisma.userOrganization.findFirst({
      where: {
        userId,
        organizationId: orgId,
      },
      include: {
        user: true,
        organization: true,
      },
    });

    if (!membership) {
      throw new UnauthorizedException('Access denied');
    }

    return {
      user: this.sanitizeUser(membership.user),
      org: membership.organization,
      role: membership.role,
    };
  }
}
