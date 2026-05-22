import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrisma, MockPrisma } from '../test/prisma.mock';

describe('SearchService', () => {
  let service: SearchService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<SearchService>(SearchService);
  });

  it('should search suppliers, products, and documents by query', async () => {
    prisma.supplier.findMany.mockResolvedValue([
      { id: 's1', name: 'Têxteis do Ave', supplierCode: 'TDA-PT', type: 'MILL', country: 'Portugal' },
    ]);
    prisma.product.findMany.mockResolvedValue([
      { id: 'p1', name: 'Tea-Length Dress', sku: 'LA-SS26-0045', category: 'Dresses', season: 'SS26' },
    ]);
    prisma.document.findMany.mockResolvedValue([
      { id: 'd1', filename: 'oeko-tex-2025.pdf', supplier: { name: 'Têxteis do Ave' }, documentType: { name: 'OEKO-TEX 100' } },
    ]);

    const result = await service.search('org-1', 'tex');

    expect(result.suppliers).toHaveLength(1);
    expect(result.suppliers[0].name).toBe('Têxteis do Ave');
    expect(result.products).toHaveLength(1);
    expect(result.documents).toHaveLength(1);
    expect(result.documents[0].supplierName).toBe('Têxteis do Ave');
  });

  it('should scope all queries by orgId', async () => {
    prisma.supplier.findMany.mockResolvedValue([]);
    prisma.product.findMany.mockResolvedValue([]);
    prisma.document.findMany.mockResolvedValue([]);

    await service.search('org-1', 'test');

    expect(prisma.supplier.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ orgId: 'org-1' }) }),
    );
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ orgId: 'org-1' }) }),
    );
    expect(prisma.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ orgId: 'org-1' }) }),
    );
  });

  it('should limit results to 5 per category', async () => {
    prisma.supplier.findMany.mockResolvedValue([]);
    prisma.product.findMany.mockResolvedValue([]);
    prisma.document.findMany.mockResolvedValue([]);

    await service.search('org-1', 'ab');

    expect(prisma.supplier.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 }),
    );
  });

  it('should return empty arrays for queries shorter than 2 chars', async () => {
    const result = await service.search('org-1', 'a');
    expect(result).toEqual({ suppliers: [], products: [], documents: [] });
    expect(prisma.supplier.findMany).not.toHaveBeenCalled();
  });
});
