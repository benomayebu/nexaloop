import { Controller, Patch, Body, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentOrg } from '../auth/current-org.decorator';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Patch('complete')
  @UseGuards(JwtAuthGuard)
  completeOnboarding(
    @Body() dto: CompleteOnboardingDto,
    @CurrentOrg() orgId: string,
  ) {
    return this.onboardingService.completeOnboarding(orgId, dto);
  }
}
