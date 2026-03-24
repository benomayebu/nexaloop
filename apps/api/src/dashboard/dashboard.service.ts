import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(orgId: string) {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [
      activeSuppliers,
      approvedDocs,
      pendingReview,
      expiringSoon,
      expiringDocuments,
      documentsByStatus,
      totalProducts,
    ] = await Promise.all([
      // Active suppliers count
      this.prisma.supplier.count({
        where: { orgId, status: 'ACTIVE' },
      }),

      // Approved documents count
      this.prisma.document.count({
        where: { orgId, status: 'APPROVED' },
      }),

      // Pending review documents count
      this.prisma.document.count({
        where: { orgId, status: 'PENDING_REVIEW' },
      }),

      // Documents expiring within 30 days
      this.prisma.document.count({
        where: {
          orgId,
          status: 'APPROVED',
          expiryDate: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
      }),

      // Expiring documents list (for the table)
      this.prisma.document.findMany({
        where: {
          orgId,
          status: 'APPROVED',
          expiryDate: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
        include: {
          supplier: { select: { id: true, name: true } },
          documentType: { select: { id: true, name: true } },
        },
        orderBy: { expiryDate: 'asc' },
        take: 10,
      }),

      // Document status breakdown
      this.prisma.document.groupBy({
        by: ['status'],
        where: { orgId },
        _count: { id: true },
      }),

      // Total active products
      this.prisma.product.count({
        where: { orgId, status: 'ACTIVE' },
      }),
    ]);

    const statusBreakdown = documentsByStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      stats: {
        activeSuppliers,
        approvedDocs,
        pendingReview,
        expiringSoon,
        totalProducts,
      },
      expiringDocuments,
      documentsByStatus: statusBreakdown,
    };
  }
}
