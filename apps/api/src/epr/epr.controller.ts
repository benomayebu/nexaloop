import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { EprService } from './epr.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentOrg } from '../auth/current-org.decorator';

@Controller('epr')
@UseGuards(JwtAuthGuard)
export class EprController {
  constructor(private readonly eprService: EprService) {}

  /**
   * GET /epr/export?format=json|csv
   * Export EPR regulatory data for all active products.
   */
  @Get('export')
  async exportData(
    @CurrentOrg() orgId: string,
    @Query('format') format?: string,
  ) {
    return this.eprService.generateExport(
      orgId,
      format === 'csv' ? 'csv' : 'json',
    );
  }

  /**
   * GET /epr/download
   * Download EPR data as a CSV file.
   */
  @Get('download')
  async downloadCsv(
    @CurrentOrg() orgId: string,
    @Res() res: Response,
  ) {
    const csv = await this.eprService.generateExport(orgId, 'csv');
    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="nexaloop-epr-export-${timestamp}.csv"`,
    );
    res.send(csv);
  }
}
