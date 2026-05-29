import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentOrg } from '../auth/current-org.decorator';
import { DashboardService } from './dashboard.service';
import { AiService } from '../ai/ai.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly aiService: AiService,
  ) {}

  @Get('stats')
  getStats(@CurrentOrg() orgId: string) {
    return this.dashboardService.getStats(orgId);
  }

  @Get('insights')
  async getInsights(@CurrentOrg() orgId: string) {
    const { stats } = await this.dashboardService.getStats(orgId);
    const insights = this.aiService.generateInsights({
      expiringSoon: stats.expiringSoon,
      pendingReview: stats.pendingReview,
      openTasks: 0, // CRM stats not available here — use CRM endpoint for full context
      overdueTasks: 0,
      complianceScore: stats.complianceScore,
      highRiskSuppliers: 0,
    });
    return { insights };
  }
}
