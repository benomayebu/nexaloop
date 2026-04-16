import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ProductStatus, DocumentStatus, SupplierType } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AddProductSupplierDto } from './dto/add-product-supplier.dto';

const STATUS_PRIORITY: Record<DocumentStatus, number> = {
  [DocumentStatus.APPROVED]:       4,
  [DocumentStatus.PENDING_REVIEW]: 3,
  [DocumentStatus.REJECTED]:       2,
  [DocumentStatus.EXPIRED]:        1,
};

export interface ComplianceCell {
  supplierId: string;
  documentTypeId: string;
  applicable: boolean;
  status: DocumentStatus | 'MISSING' | null;
  documentId: string | null;
  expiryDate: Date | null;
}

export interface ProductComplianceResult {
  suppliers: { id: string; name: string; type: SupplierType; riskLevel: string }[];
  documentTypes: { id: string; name: string; applicableTo: string[] }[];
  cells: ComplianceCell[];
  summary: { compliant: number; total: number; score: number };
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    orgId: string,
    filters: { status?: ProductStatus; category?: string; q?: string },
  ) {
    const products = await this.prisma.product.findMany({
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
      include: {
        _count: { select: { suppliers: true } },
        suppliers: {
          include: {
            supplier: {
              select: {
                id: true,
                documents: {
                  where: { orgId, status: 'APPROVED' },
                  select: { id: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Compute compliance score in-memory; strip the nested supplier detail
    return products.map(({ suppliers, ...product }) => {
      const total = suppliers.length;
      const compliant = suppliers.filter(
        (link) => link.supplier.documents.length > 0,
      ).length;
      return {
        ...product,
        complianceScore: total === 0 ? null : Math.round((compliant / total) * 100),
      };
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

  async getProductCompliance(
    orgId: string,
    productId: string,
  ): Promise<ProductComplianceResult> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, orgId },
      include: {
        suppliers: {
          include: {
            supplier: {
              select: { id: true, name: true, type: true, riskLevel: true },
            },
          },
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');

    const suppliers = product.suppliers.map((link) => link.supplier);

    if (suppliers.length === 0) {
      return {
        suppliers: [],
        documentTypes: [],
        cells: [],
        summary: { compliant: 0, total: 0, score: 100 },
      };
    }

    const supplierIds = suppliers.map((s) => s.id);

    const [documentTypes, documents] = await Promise.all([
      this.prisma.documentType.findMany({
        where: { orgId, isActive: true },
        select: { id: true, name: true, requiredForSupplierTypes: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.document.findMany({
        where: { orgId, supplierId: { in: supplierIds } },
        select: {
          id: true,
          supplierId: true,
          documentTypeId: true,
          status: true,
          expiryDate: true,
        },
      }),
    ]);

    // Index documents: "supplierId:documentTypeId" → best-status document
    const bestDoc = new Map<
      string,
      { id: string; status: DocumentStatus; expiryDate: Date | null }
    >();
    for (const doc of documents) {
      const key = `${doc.supplierId}:${doc.documentTypeId}`;
      const existing = bestDoc.get(key);
      if (
        !existing ||
        STATUS_PRIORITY[doc.status] > STATUS_PRIORITY[existing.status]
      ) {
        bestDoc.set(key, {
          id: doc.id,
          status: doc.status,
          expiryDate: doc.expiryDate,
        });
      }
    }

    const cells: ComplianceCell[] = suppliers.flatMap((supplier) =>
      documentTypes.map((dt) => {
        const applicable =
          dt.requiredForSupplierTypes.length === 0 ||
          dt.requiredForSupplierTypes.includes(supplier.type);
        const doc = applicable
          ? bestDoc.get(`${supplier.id}:${dt.id}`)
          : undefined;
        return {
          supplierId: supplier.id,
          documentTypeId: dt.id,
          applicable,
          status: applicable ? (doc?.status ?? 'MISSING') : null,
          documentId: doc?.id ?? null,
          expiryDate: doc?.expiryDate ?? null,
        };
      }),
    );

    // A supplier is "fully compliant" if all applicable doc types are APPROVED
    const compliant = suppliers.filter((supplier) => {
      const applicableCells = cells.filter(
        (c) => c.supplierId === supplier.id && c.applicable,
      );
      return (
        applicableCells.length > 0 &&
        applicableCells.every((c) => c.status === DocumentStatus.APPROVED)
      );
    }).length;

    return {
      suppliers,
      documentTypes: documentTypes.map((dt) => ({
        id: dt.id,
        name: dt.name,
        applicableTo: dt.requiredForSupplierTypes,
      })),
      cells,
      summary: {
        compliant,
        total: suppliers.length,
        score: Math.round((compliant / suppliers.length) * 100),
      },
    };
  }
}
