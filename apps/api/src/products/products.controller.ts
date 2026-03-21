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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
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

  @Get('products/:id')
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.productsService.findOne(orgId, id);
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
}
