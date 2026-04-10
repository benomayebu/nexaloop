import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async completeOnboarding(orgId: string, dto: CompleteOnboardingDto) {
    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.update({
        where: { id: orgId },
        data: { onboardingComplete: true },
      });

      if (dto.supplierName && dto.supplierCountry) {
        await tx.supplier.create({
          data: {
            orgId,
            name: dto.supplierName,
            country: dto.supplierCountry,
            type: 'OTHER',
            status: 'ACTIVE',
            riskLevel: 'UNKNOWN',
          },
        });
      }

      return org;
    });
  }
}
