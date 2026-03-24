import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EprService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate EPR (Extended Producer Responsibility) export data.
   * Returns all active products with their supply chain data
   * in a format suitable for EU regulatory reporting.
   */
  async generateExport(orgId: string, format: 'json' | 'csv' = 'json') {
    const products = await this.prisma.product.findMany({
      where: { orgId, status: 'ACTIVE' },
      include: {
        org: { select: { name: true } },
        suppliers: {
          include: {
            supplier: {
              select: {
                name: true,
                type: true,
                country: true,
                documents: {
                  where: { status: 'APPROVED' },
                  select: {
                    documentType: { select: { name: true } },
                    status: true,
                    expiryDate: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { sku: 'asc' },
    });

    const rows = products.flatMap((product) => {
      if (product.suppliers.length === 0) {
        return [
          {
            producer: product.org.name,
            productName: product.name,
            sku: product.sku,
            category: product.category ?? '',
            season: product.season ?? '',
            materialComposition: product.materialComposition ?? '',
            countryOfOrigin: product.countryOfOrigin ?? '',
            weight: product.weight ?? '',
            weightUnit: product.weightUnit ?? 'kg',
            recycledContentPct: product.recycledContent ?? '',
            supplierName: '',
            supplierRole: '',
            supplierCountry: '',
            supplierType: '',
            certificationCount: 0,
            complianceStatus: 'NO_SUPPLIERS',
          },
        ];
      }

      return product.suppliers.map((link) => ({
        producer: product.org.name,
        productName: product.name,
        sku: product.sku,
        category: product.category ?? '',
        season: product.season ?? '',
        materialComposition: product.materialComposition ?? '',
        countryOfOrigin: product.countryOfOrigin ?? '',
        weight: product.weight ?? '',
        weightUnit: product.weightUnit ?? 'kg',
        recycledContentPct: product.recycledContent ?? '',
        supplierName: link.supplier.name,
        supplierRole: link.role,
        supplierCountry: link.supplier.country,
        supplierType: link.supplier.type,
        certificationCount: link.supplier.documents.length,
        complianceStatus:
          link.supplier.documents.length > 0 ? 'COMPLIANT' : 'MISSING_DOCS',
      }));
    });

    if (format === 'csv') {
      return this.toCsv(rows);
    }

    return {
      exportedAt: new Date().toISOString(),
      producer: products[0]?.org?.name ?? '',
      totalProducts: products.length,
      totalRows: rows.length,
      data: rows,
    };
  }

  private toCsv(rows: Record<string, unknown>[]): string {
    if (rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const csvRows = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = String(row[h] ?? '');
            // Escape commas and quotes in CSV
            return val.includes(',') || val.includes('"')
              ? `"${val.replace(/"/g, '""')}"`
              : val;
          })
          .join(','),
      ),
    ];
    return csvRows.join('\n');
  }
}
