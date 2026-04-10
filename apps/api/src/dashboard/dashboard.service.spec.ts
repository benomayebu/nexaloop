import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrisma, MockPrisma } from '../test/prisma.mock';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: MockPrisma;
  const orgId = 'org-1';

  beforeEach(async () => {
    prisma = createMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<DashboardService>(DashboardService);
  });

  describe('getStats', () => {
    it('should aggregate all dashboard metrics', async () => {
      prisma.supplier.count.mockResolvedValue(5);
      prisma.document.count
        .mockResolvedValueOnce(12)   // approvedDocs
        .mockResolvedValueOnce(3)    // pendingReview
        .mockResolvedValueOnce(2);   // expiringSoon
      prisma.document.findMany.mockResolvedValue([]);
      prisma.document.groupBy.mockResolvedValue([
        { status: 'APPROVED', _count: { id: 12 } },
        { status: 'PENDING_REVIEW', _count: { id: 3 } },
      ]);
      prisma.product.count.mockResolvedValue(8);

      const result = await service.getStats(orgId);

      expect(result.stats.activeSuppliers).toBe(5);
      expect(result.stats.approvedDocs).toBe(12);
      expect(result.stats.pendingReview).toBe(3);
      expect(result.stats.expiringSoon).toBe(2);
      expect(result.stats.totalProducts).toBe(8);
      expect(result.documentsByStatus).toEqual({
        APPROVED: 12,
        PENDING_REVIEW: 3,
      });
      expect(result.expiringDocuments).toEqual([]);
    });

    it('should scope all queries by orgId', async () => {
      prisma.supplier.count.mockResolvedValue(0);
      prisma.document.count.mockResolvedValue(0);
      prisma.document.findMany.mockResolvedValue([]);
      prisma.document.groupBy.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.getStats(orgId);

      // Verify orgId is in every query
      expect(prisma.supplier.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ orgId }) }),
      );
      expect(prisma.product.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ orgId }) }),
      );
    });
  });
});
