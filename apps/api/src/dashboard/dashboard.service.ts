import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(orgId: string) {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [
      activeSuppliers,
      approvedDocs,
      pendingReview,
      expiringSoon,
      expiringDocuments,
      documentsByStatus,
      totalProducts,
      suppliersByRisk,
      // For compliance score: count active suppliers that have ≥1 APPROVED doc
      suppliersWithApprovedDoc,
    ] = await Promise.all([
      this.prisma.supplier.count({ where: { orgId, status: 'ACTIVE' } }),

      this.prisma.document.count({ where: { orgId, status: 'APPROVED' } }),

      this.prisma.document.count({ where: { orgId, status: 'PENDING_REVIEW' } }),

      this.prisma.document.count({
        where: {
          orgId,
          status: 'APPROVED',
          expiryDate: { gte: now, lte: thirtyDaysFromNow },
        },
      }),

      // Expiring documents list for the dashboard table (soonest first)
      this.prisma.document.findMany({
        where: {
          orgId,
          status: 'APPROVED',
          expiryDate: { gte: now, lte: thirtyDaysFromNow },
        },
        include: {
          supplier: { select: { id: true, name: true } },
          documentType: { select: { id: true, name: true } },
        },
        orderBy: { expiryDate: 'asc' },
        take: 10,
      }),

      // Document status breakdown for the bar chart
      this.prisma.document.groupBy({
        by: ['status'],
        where: { orgId },
        _count: { id: true },
      }),

      this.prisma.product.count({ where: { orgId, status: 'ACTIVE' } }),

      // Supplier count by risk level — for the risk breakdown widget
      this.prisma.supplier.groupBy({
        by: ['riskLevel'],
        where: { orgId, status: 'ACTIVE' },
        _count: { id: true },
      }),

      // Compliance score: distinct active suppliers that have ≥1 APPROVED document
      this.prisma.supplier.count({
        where: {
          orgId,
          status: 'ACTIVE',
          documents: { some: { orgId, status: 'APPROVED' } },
        },
      }),
    ]);

    const statusBreakdown = documentsByStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

    const riskBreakdown = (suppliersByRisk ?? []).reduce(
      (acc, item) => {
        acc[item.riskLevel] = item._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Compliance score = % of active suppliers with ≥1 approved document.
    // 0 active suppliers → 100% (nothing to be non-compliant about).
    const complianceScore =
      activeSuppliers === 0
        ? 100
        : Math.round((suppliersWithApprovedDoc / activeSuppliers) * 100);

    return {
      stats: {
        activeSuppliers,
        approvedDocs,
        pendingReview,
        expiringSoon,
        totalProducts,
        complianceScore,
      },
      expiringDocuments,
      documentsByStatus: statusBreakdown,
      riskBreakdown,
    };
  }
}
