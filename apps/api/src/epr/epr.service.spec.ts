import { Test, TestingModule } from '@nestjs/testing';
import { EprService } from './epr.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrisma, MockPrisma } from '../test/prisma.mock';

describe('EprService', () => {
  let service: EprService;
  let prisma: MockPrisma;
  const orgId = 'org-1';

  const mockProducts = [
    {
      id: 'p-1',
      name: 'T-Shirt',
      sku: 'TS-001',
      category: 'Apparel',
      season: 'SS25',
      materialComposition: '100% cotton',
      countryOfOrigin: 'Portugal',
      weight: 0.25,
      weightUnit: 'kg',
      recycledContent: 30,
      status: 'ACTIVE',
      org: { name: 'Test Brand' },
      suppliers: [
        {
          role: 'CUT_AND_SEW',
          supplier: {
            name: 'Factory A',
            type: 'TIER1_FACTORY',
            country: 'Portugal',
            documents: [{ documentType: { name: 'BSCI' }, status: 'APPROVED', expiryDate: null }],
          },
        },
        {
          role: 'FABRIC_SUPPLIER',
          supplier: {
            name: 'Mill B',
            type: 'MILL',
            country: 'India',
            documents: [],
          },
        },
      ],
    },
    {
      id: 'p-2',
      name: 'Jacket',
      sku: 'JK-001',
      category: 'Outerwear',
      season: null,
      materialComposition: null,
      countryOfOrigin: null,
      weight: null,
      weightUnit: null,
      recycledContent: null,
      status: 'ACTIVE',
      org: { name: 'Test Brand' },
      suppliers: [],
    },
  ];

  beforeEach(async () => {
    prisma = createMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EprService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<EprService>(EprService);
  });

  describe('generateExport (JSON)', () => {
    it('should return structured EPR export with all products', async () => {
      prisma.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.generateExport(orgId, 'json') as any;

      expect(result.producer).toBe('Test Brand');
      expect(result.totalProducts).toBe(2);
      // p-1 has 2 suppliers (2 rows) + p-2 has 0 suppliers (1 row) = 3 rows
      expect(result.totalRows).toBe(3);
      expect(result.data[0].sku).toBe('TS-001');
      expect(result.data[0].complianceStatus).toBe('COMPLIANT');
      expect(result.data[1].complianceStatus).toBe('MISSING_DOCS');
    });

    it('should show NO_SUPPLIERS status for products without suppliers', async () => {
      prisma.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.generateExport(orgId, 'json') as any;
      const noSupplierRow = result.data.find((r: any) => r.sku === 'JK-001');
      expect(noSupplierRow.complianceStatus).toBe('NO_SUPPLIERS');
      expect(noSupplierRow.supplierName).toBe('');
    });
  });

  describe('generateExport (CSV)', () => {
    it('should return CSV string with headers and data rows', async () => {
      prisma.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.generateExport(orgId, 'csv') as string;

      const lines = result.split('\n');
      expect(lines[0]).toContain('producer');
      expect(lines[0]).toContain('sku');
      expect(lines[0]).toContain('complianceStatus');
      // Header + 3 data rows
      expect(lines).toHaveLength(4);
    });

    it('should return empty string for no products', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      const result = await service.generateExport(orgId, 'csv') as string;
      expect(result).toBe('');
    });
  });
});
