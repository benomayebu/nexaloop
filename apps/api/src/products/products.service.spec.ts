import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrisma, MockPrisma } from '../test/prisma.mock';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: MockPrisma;
  const orgId = 'org-1';

  beforeEach(async () => {
    prisma = createMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<ProductsService>(ProductsService);
  });

  describe('list', () => {
    it('should return products with supplier count', async () => {
      const products = [{ id: 'p-1', _count: { suppliers: 2 } }];
      prisma.product.findMany.mockResolvedValue(products);

      const result = await service.list(orgId, {});
      expect(result).toEqual(products);
    });

    it('should apply search filter', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      await service.list(orgId, { q: 'shirt' });

      const call = prisma.product.findMany.mock.calls[0][0];
      expect(call.where.OR).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create product with DPP fields', async () => {
      const dto = {
        name: 'T-Shirt',
        sku: 'TS-001',
        dppEnabled: true,
        materialComposition: '100% organic cotton',
        recycledContent: 30,
      };
      prisma.product.create.mockResolvedValue({ id: 'p-1', ...dto, orgId });

      const result = await service.create(orgId, dto as any);
      expect(result.dppEnabled).toBe(true);
      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId,
            dppEnabled: true,
            materialComposition: '100% organic cotton',
            recycledContent: 30,
          }),
        }),
      );
    });

    it('should throw ConflictException on duplicate SKU', async () => {
      const err = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });
      prisma.product.create.mockRejectedValue(err);

      await expect(
        service.create(orgId, { name: 'Test', sku: 'DUP' } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return product with suppliers', async () => {
      const product = { id: 'p-1', suppliers: [] };
      prisma.product.findFirst.mockResolvedValue(product);

      const result = await service.findOne(orgId, 'p-1');
      expect(result).toEqual(product);
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(service.findOne(orgId, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update product fields', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'p-1', sku: 'TS-001' });
      prisma.product.update.mockResolvedValue({ id: 'p-1', name: 'Updated' });

      const result = await service.update(orgId, 'p-1', { name: 'Updated' } as any);
      expect(result.name).toBe('Updated');
    });

    it('should check for SKU conflict when changing SKU', async () => {
      prisma.product.findFirst
        .mockResolvedValueOnce({ id: 'p-1', sku: 'OLD' })  // existing product
        .mockResolvedValueOnce({ id: 'p-2', sku: 'TAKEN' }); // conflict

      await expect(
        service.update(orgId, 'p-1', { sku: 'TAKEN' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should not check SKU conflict if SKU unchanged', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'p-1', sku: 'SAME' });
      prisma.product.update.mockResolvedValue({ id: 'p-1' });

      await service.update(orgId, 'p-1', { sku: 'SAME', name: 'Updated' } as any);
      // findFirst called only once (for existing check, not conflict check)
      expect(prisma.product.findFirst).toHaveBeenCalledTimes(1);
    });
  });

  describe('softDelete', () => {
    it('should set status to DISCONTINUED', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'p-1' });
      prisma.product.update.mockResolvedValue({ id: 'p-1', status: 'DISCONTINUED' });

      const result = await service.softDelete(orgId, 'p-1');
      expect(result.status).toBe('DISCONTINUED');
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(service.softDelete(orgId, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addSupplier', () => {
    it('should link supplier to product', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'p-1' });
      prisma.supplier.findFirst.mockResolvedValue({ id: 's-1' });
      prisma.productSupplier.create.mockResolvedValue({
        id: 'ps-1',
        productId: 'p-1',
        supplierId: 's-1',
        role: 'CUT_AND_SEW',
      });

      const result = await service.addSupplier(orgId, 'p-1', {
        supplierId: 's-1',
        role: 'CUT_AND_SEW' as any,
      });
      expect(result.role).toBe('CUT_AND_SEW');
    });

    it('should throw NotFoundException if product not in org', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(
        service.addSupplier(orgId, 'missing', { supplierId: 's-1', role: 'CUT_AND_SEW' as any }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if supplier not in org', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'p-1' });
      prisma.supplier.findFirst.mockResolvedValue(null);
      await expect(
        service.addSupplier(orgId, 'p-1', { supplierId: 'missing', role: 'CUT_AND_SEW' as any }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on duplicate link', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'p-1' });
      prisma.supplier.findFirst.mockResolvedValue({ id: 's-1' });
      const err = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });
      prisma.productSupplier.create.mockRejectedValue(err);

      await expect(
        service.addSupplier(orgId, 'p-1', { supplierId: 's-1', role: 'CUT_AND_SEW' as any }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('removeSupplier', () => {
    it('should delete supplier link', async () => {
      prisma.productSupplier.findFirst.mockResolvedValue({ id: 'ps-1' });
      prisma.productSupplier.delete.mockResolvedValue({});

      await service.removeSupplier(orgId, 'p-1', 'ps-1');
      expect(prisma.productSupplier.delete).toHaveBeenCalledWith({ where: { id: 'ps-1' } });
    });

    it('should throw NotFoundException if link not found', async () => {
      prisma.productSupplier.findFirst.mockResolvedValue(null);
      await expect(service.removeSupplier(orgId, 'p-1', 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
