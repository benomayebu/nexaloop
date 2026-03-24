import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DppService } from './dpp.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentOrg } from '../auth/current-org.decorator';

@Controller()
export class DppController {
  constructor(private readonly dppService: DppService) {}

  /**
   * Authenticated endpoint — full DPP with all supplier details.
   * GET /products/:id/dpp
   */
  @Get('products/:id/dpp')
  @UseGuards(JwtAuthGuard)
  generateDpp(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.dppService.generateDpp(orgId, id);
  }

  /**
   * Public endpoint — no auth required.
   * GET /dpp/:id
   * Used for QR code scanning by consumers/regulators.
   */
  @Get('dpp/:id')
  getPublicDpp(@Param('id') id: string) {
    return this.dppService.getPublicDpp(id);
  }
}
