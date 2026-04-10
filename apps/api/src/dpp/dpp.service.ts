import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DppService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a Digital Product Passport (DPP) for a product.
   * Returns structured JSON-LD compatible data per ESPR requirements.
   */
  async generateDpp(orgId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, orgId },
      include: {
        org: { select: { name: true } },
        suppliers: {
          include: {
            supplier: {
              select: {
                name: true,
                type: true,
                country: true,
                city: true,
                status: true,
                documents: {
                  where: { status: 'APPROVED' },
                  include: {
                    documentType: { select: { name: true } },
                  },
                  orderBy: { expiryDate: 'desc' },
                },
              },
            },
          },
        },
      },
    });

    if (!product) throw new NotFoundException('Product not found');

    // Calculate compliance score
    const totalSuppliers = product.suppliers.length;
    const suppliersWithDocs = product.suppliers.filter(
      (s) => s.supplier.documents.length > 0,
    ).length;
    const complianceScore =
      totalSuppliers > 0 ? Math.round((suppliersWithDocs / totalSuppliers) * 100) : 0;

    // Build JSON-LD structured DPP
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      identifier: product.sku,
      name: product.name,
      category: product.category,
      brand: {
        '@type': 'Organization',
        name: product.org.name,
      },
      // ESPR-specific fields
      dpp: {
        version: '1.0',
        generatedAt: new Date().toISOString(),
        productId: product.id,
        sku: product.sku,
        status: product.status,
        season: product.season,
        materialComposition: product.materialComposition,
        countryOfOrigin: product.countryOfOrigin,
        manufacturingDate: product.manufacturingDate,
        weight: product.weight
          ? { value: product.weight, unit: product.weightUnit }
          : null,
        recycledContent: product.recycledContent
          ? { percentage: product.recycledContent }
          : null,
        repairabilityScore: product.repairabilityScore,
        complianceScore,
        supplyChain: product.suppliers.map((link) => ({
          role: link.role,
          supplier: {
            name: link.supplier.name,
            type: link.supplier.type,
            country: link.supplier.country,
            city: link.supplier.city,
          },
          certifications: link.supplier.documents.map((doc) => ({
            type: doc.documentType.name,
            status: doc.status,
            expiryDate: doc.expiryDate,
          })),
        })),
      },
    };
  }

  /**
   * Public DPP endpoint — no auth required.
   * Returns limited product traceability info for QR code scanning.
   */
  async getPublicDpp(productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, dppEnabled: true },
      include: {
        org: { select: { name: true } },
        suppliers: {
          include: {
            supplier: {
              select: {
                name: true,
                type: true,
                country: true,
              },
            },
          },
        },
      },
    });

    if (!product) throw new NotFoundException('Digital Product Passport not found');

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      identifier: product.sku,
      name: product.name,
      category: product.category,
      brand: product.org.name,
      materialComposition: product.materialComposition,
      countryOfOrigin: product.countryOfOrigin,
      manufacturingDate: product.manufacturingDate,
      weight: product.weight
        ? { value: product.weight, unit: product.weightUnit }
        : null,
      recycledContent: product.recycledContent
        ? `${product.recycledContent}%`
        : null,
      repairabilityScore: product.repairabilityScore,
      supplyChain: product.suppliers.map((link) => ({
        role: link.role,
        supplierCountry: link.supplier.country,
        supplierType: link.supplier.type,
      })),
    };
  }
}
