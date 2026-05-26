import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(orgId: string) {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const sixtyDaysFromNow = new Date(now);
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    const [
      activeSuppliers,
      approvedDocs,
      pendingReview,
      expiringSoon,
      expiringDocuments,
      documentsByStatus,
      totalProducts,
      suppliersByRisk,
      suppliersWithApprovedDoc,
      totalDocuments,
      pendingDocuments,
      riskySuppliers,
      suppliersByCountry,
      dppReadyCount,
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

      this.prisma.document.findMany({
        where: {
          orgId,
          status: 'APPROVED',
          expiryDate: { gte: now, lte: sixtyDaysFromNow },
        },
        include: {
          supplier: { select: { id: true, name: true } },
          documentType: { select: { id: true, name: true } },
        },
        orderBy: { expiryDate: 'asc' },
        take: 8,
      }),

      this.prisma.document.groupBy({
        by: ['status'],
        where: { orgId },
        _count: { id: true },
      }),

      this.prisma.product.count({ where: { orgId, status: 'ACTIVE' } }),

      this.prisma.supplier.groupBy({
        by: ['riskLevel'],
        where: { orgId, status: 'ACTIVE' },
        _count: { id: true },
      }),

      this.prisma.supplier.count({
        where: {
          orgId,
          status: 'ACTIVE',
          documents: { some: { orgId, status: 'APPROVED' } },
        },
      }),

      this.prisma.document.count({ where: { orgId } }),

      this.prisma.document.findMany({
        where: { orgId, status: 'PENDING_REVIEW' },
        include: {
          supplier: { select: { id: true, name: true } },
          documentType: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 4,
      }),

      this.prisma.supplier.findMany({
        where: { orgId, status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          type: true,
          country: true,
          city: true,
          riskLevel: true,
          _count: { select: { documents: true } },
        },
        orderBy: { riskLevel: 'desc' },
        take: 5,
      }),

      this.prisma.supplier.groupBy({
        by: ['country'],
        where: { orgId },
        _count: { id: true },
      }),

      this.prisma.product.count({
        where: {
          orgId,
          status: 'ACTIVE',
          suppliers: { some: {} },
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

    const countryBreakdown = (suppliersByCountry ?? []).reduce(
      (acc, item) => {
        acc[item.country] = item._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

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
        totalDocuments,
        complianceScore,
        dppReadyCount,
      },
      expiringDocuments,
      pendingDocuments,
      riskySuppliers,
      documentsByStatus: statusBreakdown,
      riskBreakdown,
      countryBreakdown,
    };
  }
}
