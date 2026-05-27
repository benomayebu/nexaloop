import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { SuppliersService } from './suppliers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentOrg } from '../auth/current-org.decorator';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { SupplierType, SupplierStatus, RiskLevel } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  // --- Supplier endpoints ---

  @Get('suppliers')
  list(
    @CurrentOrg() orgId: string,
    @Query('type') type?: SupplierType,
    @Query('status') status?: SupplierStatus,
    @Query('riskLevel') riskLevel?: RiskLevel,
    @Query('q') q?: string,
  ) {
    return this.suppliersService.list(orgId, { type, status, riskLevel, q });
  }

  @Post('suppliers')
  create(@CurrentOrg() orgId: string, @Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(orgId, dto);
  }

  @Get('suppliers/export-csv')
  async exportCsv(
    @CurrentOrg() orgId: string,
    @Res() res: Response,
  ) {
    const csv = await this.suppliersService.exportCsv(orgId);
    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="suppliers-${timestamp}.csv"`);
    res.send(csv);
  }

  @Post('suppliers/import-csv')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  importCsv(
    @CurrentOrg() orgId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.suppliersService.importCsv(orgId, file);
  }

  @Get('suppliers/:id')
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.suppliersService.findOne(orgId, id);
  }

  @Put('suppliers/:id')
  update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(orgId, id, dto);
  }

  @Delete('suppliers/:id')
  @HttpCode(HttpStatus.OK)
  softDelete(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.suppliersService.softDelete(orgId, id);
  }

  // --- Contact sub-routes ---

  @Post('suppliers/:supplierId/contacts')
  createContact(
    @CurrentOrg() orgId: string,
    @Param('supplierId') supplierId: string,
    @Body() dto: CreateContactDto,
  ) {
    return this.suppliersService.createContact(orgId, supplierId, dto);
  }

  @Put('contacts/:id')
  updateContact(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.suppliersService.updateContact(orgId, id, dto);
  }

  @Delete('contacts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteContact(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.suppliersService.deleteContact(orgId, id);
  }
}
