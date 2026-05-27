import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProductsService, ProductComplianceResult } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentOrg } from '../auth/current-org.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AddProductSupplierDto } from './dto/add-product-supplier.dto';
import { ProductStatus } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('products')
  list(
    @CurrentOrg() orgId: string,
    @Query('status') status?: ProductStatus,
    @Query('category') category?: string,
    @Query('q') q?: string,
  ) {
    return this.productsService.list(orgId, { status, category, q });
  }

  @Post('products')
  create(@CurrentOrg() orgId: string, @Body() dto: CreateProductDto) {
    return this.productsService.create(orgId, dto);
  }

  @Post('products/import-csv')
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
    return this.productsService.importCsv(orgId, file);
  }

  @Get('products/:id')
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.productsService.findOne(orgId, id);
  }

  @Get('products/:id/compliance')
  getProductCompliance(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ): Promise<ProductComplianceResult> {
    return this.productsService.getProductCompliance(orgId, id);
  }

  @Put('products/:id')
  update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(orgId, id, dto);
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.OK)
  softDelete(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.productsService.softDelete(orgId, id);
  }

  @Post('products/:productId/suppliers')
  addSupplier(
    @CurrentOrg() orgId: string,
    @Param('productId') productId: string,
    @Body() dto: AddProductSupplierDto,
  ) {
    return this.productsService.addSupplier(orgId, productId, dto);
  }

  @Delete('products/:productId/suppliers/:linkId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeSupplier(
    @CurrentOrg() orgId: string,
    @Param('productId') productId: string,
    @Param('linkId') linkId: string,
  ): Promise<void> {
    await this.productsService.removeSupplier(orgId, productId, linkId);
  }

  @Post('products/:id/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Only image files are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.productsService.uploadImage(orgId, id, file);
  }
}
