import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DppService } from './dpp.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrisma, MockPrisma } from '../test/prisma.mock';

describe('DppService', () => {
  let service: DppService;
  let prisma: MockPrisma;
  const orgId = 'org-1';

  beforeEach(async () => {
    prisma = createMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DppService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<DppService>(DppService);
  });

  describe('generateDpp', () => {
    it('should return JSON-LD structured DPP', async () => {
      prisma.product.findFirst.mockResolvedValue({
        id: 'p-1',
        name: 'T-Shirt',
        sku: 'TS-001',
        category: 'Apparel',
        status: 'ACTIVE',
        season: 'SS25',
        materialComposition: '100% organic cotton',
        countryOfOrigin: 'Portugal',
        manufacturingDate: new Date('2025-01-15'),
        weight: 0.25,
        weightUnit: 'kg',
        recycledContent: 30,
        repairabilityScore: 7,
        org: { name: 'Test Brand' },
        suppliers: [
          {
            role: 'CUT_AND_SEW',
            supplier: {
              name: 'Factory A',
              type: 'TIER1_FACTORY',
              country: 'Portugal',
              city: 'Porto',
              status: 'ACTIVE',
              documents: [
                {
                  documentType: { name: 'BSCI Audit' },
                  status: 'APPROVED',
                  expiryDate: new Date('2026-06-01'),
                },
              ],
            },
          },
        ],
      });

      const result = await service.generateDpp(orgId, 'p-1');

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('Product');
      expect(result.identifier).toBe('TS-001');
      expect(result.brand.name).toBe('Test Brand');
      expect(result.dpp.materialComposition).toBe('100% organic cotton');
      expect(result.dpp.complianceScore).toBe(100);
      expect(result.dpp.supplyChain).toHaveLength(1);
      expect(result.dpp.supplyChain[0].certifications).toHaveLength(1);
    });

    it('should calculate 0% compliance when no suppliers have docs', async () => {
      prisma.product.findFirst.mockResolvedValue({
        id: 'p-1',
        name: 'Test',
        sku: 'T-1',
        org: { name: 'Brand' },
        suppliers: [
          {
            role: 'FABRIC_SUPPLIER',
            supplier: {
              name: 'Mill',
              type: 'MILL',
              country: 'India',
              city: null,
              status: 'ACTIVE',
              documents: [],
            },
          },
        ],
      });

      const result = await service.generateDpp(orgId, 'p-1');
      expect(result.dpp.complianceScore).toBe(0);
    });

    it('should throw NotFoundException if product not found', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(service.generateDpp(orgId, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPublicDpp', () => {
    it('should return limited public DPP data', async () => {
      prisma.product.findFirst.mockResolvedValue({
        id: 'p-1',
        name: 'T-Shirt',
        sku: 'TS-001',
        category: 'Apparel',
        materialComposition: '100% organic cotton',
        countryOfOrigin: 'Portugal',
        manufacturingDate: new Date('2025-01-15'),
        weight: 0.25,
        weightUnit: 'kg',
        recycledContent: 30,
        repairabilityScore: 7,
        dppEnabled: true,
        org: { name: 'Test Brand' },
        suppliers: [
          {
            role: 'CUT_AND_SEW',
            supplier: { name: 'Factory A', type: 'TIER1_FACTORY', country: 'Portugal' },
          },
        ],
      });

      const result = await service.getPublicDpp('p-1');

      expect(result['@context']).toBe('https://schema.org');
      expect(result.brand).toBe('Test Brand');
      expect(result.recycledContent).toBe('30%');
      expect(result.supplyChain[0].supplierCountry).toBe('Portugal');
      // Public DPP should not include supplier names
      expect(result.supplyChain[0]).not.toHaveProperty('supplierName');
    });

    it('should throw NotFoundException if product not DPP-enabled', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(service.getPublicDpp('p-1')).rejects.toThrow(NotFoundException);
    });
  });
});
