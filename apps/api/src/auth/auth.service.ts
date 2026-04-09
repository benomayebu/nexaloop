import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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
