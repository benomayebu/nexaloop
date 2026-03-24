import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ProductStatus } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AddProductSupplierDto } from './dto/add-product-supplier.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    orgId: string,
    filters: { status?: ProductStatus; category?: string; q?: string },
  ) {
    return this.prisma.product.findMany({
      where: {
        orgId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.q
          ? {
              OR: [
                { name: { contains: filters.q, mode: 'insensitive' } },
                { sku: { contains: filters.q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { _count: { select: { suppliers: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(orgId: string, dto: CreateProductDto) {
    try {
      return await this.prisma.product.create({
        data: {
          orgId,
          name: dto.name,
          sku: dto.sku,
          category: dto.category,
          season: dto.season,
          status: dto.status,
          notes: dto.notes,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('SKU already exists in this organization');
      }
      throw err;
    }
  }

  async findOne(orgId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, orgId },
      include: {
        suppliers: {
          include: {
            supplier: {
              select: { id: true, name: true, country: true, type: true },
            },
          },
        },
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(orgId: string, id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findFirst({
      where: { id, orgId },
    });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    if (dto.sku && dto.sku !== existing.sku) {
      const conflict = await this.prisma.product.findFirst({
        where: { orgId, sku: dto.sku, NOT: { id } },
      });
      if (conflict) {
        throw new ConflictException('SKU already exists in this organization');
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        sku: dto.sku,
        category: dto.category,
        season: dto.season,
        status: dto.status,
        notes: dto.notes,
        dppEnabled: dto.dppEnabled,
        materialComposition: dto.materialComposition,
        countryOfOrigin: dto.countryOfOrigin,
        manufacturingDate: dto.manufacturingDate
          ? new Date(dto.manufacturingDate)
          : undefined,
        weight: dto.weight,
        weightUnit: dto.weightUnit,
        recycledContent: dto.recycledContent,
        repairabilityScore: dto.repairabilityScore,
      },
    });
  }

  async softDelete(orgId: string, id: string) {
    const existing = await this.prisma.product.findFirst({
      where: { id, orgId },
    });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }
    return this.prisma.product.update({
      where: { id },
      data: { status: 'DISCONTINUED' },
    });
  }

  async addSupplier(orgId: string, productId: string, dto: AddProductSupplierDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, orgId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, orgId },
    });
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    try {
      return await this.prisma.productSupplier.create({
        data: {
          productId,
          supplierId: dto.supplierId,
          role: dto.role,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'This supplier is already linked with this role',
        );
      }
      throw err;
    }
  }

  async removeSupplier(orgId: string, productId: string, linkId: string) {
    const link = await this.prisma.productSupplier.findFirst({
      where: { id: linkId, productId, product: { orgId } },
    });
    if (!link) {
      throw new NotFoundException('Supplier link not found');
    }
    await this.prisma.productSupplier.delete({ where: { id: linkId } });
  }
}
