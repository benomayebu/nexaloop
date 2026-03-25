import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrisma, MockPrisma } from '../test/prisma.mock';

describe('SuppliersService', () => {
  let service: SuppliersService;
  let prisma: MockPrisma;
  const orgId = 'org-1';

  beforeEach(async () => {
    prisma = createMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<SuppliersService>(SuppliersService);
  });

  describe('list', () => {
    it('should return suppliers filtered by orgId', async () => {
      const suppliers = [{ id: 's-1', name: 'Factory A' }];
      prisma.supplier.findMany.mockResolvedValue(suppliers);

      const result = await service.list(orgId, {});
      expect(result).toEqual(suppliers);
      expect(prisma.supplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ orgId }) }),
      );
    });

    it('should apply type, status, riskLevel, and search filters', async () => {
      prisma.supplier.findMany.mockResolvedValue([]);

      await service.list(orgId, {
        type: 'TIER1_FACTORY' as any,
        status: 'ACTIVE' as any,
        riskLevel: 'LOW' as any,
        q: 'acme',
      });

      const call = prisma.supplier.findMany.mock.calls[0][0];
      expect(call.where.type).toBe('TIER1_FACTORY');
      expect(call.where.status).toBe('ACTIVE');
      expect(call.where.riskLevel).toBe('LOW');
      expect(call.where.OR).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create a supplier with orgId', async () => {
      const dto = { name: 'New Factory', type: 'TIER1_FACTORY' as any, country: 'Bangladesh' };
      const created = { id: 's-1', ...dto, orgId };
      prisma.supplier.create.mockResolvedValue(created);

      const result = await service.create(orgId, dto as any);
      expect(result).toEqual(created);
      expect(prisma.supplier.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orgId, name: 'New Factory' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return supplier with contacts and product links', async () => {
      const supplier = { id: 's-1', name: 'Factory', contacts: [], productLinks: [] };
      prisma.supplier.findFirst.mockResolvedValue(supplier);

      const result = await service.findOne(orgId, 's-1');
      expect(result).toEqual(supplier);
      expect(prisma.supplier.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 's-1', orgId },
          include: expect.any(Object),
        }),
      );
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);
      await expect(service.findOne(orgId, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update supplier fields', async () => {
      prisma.supplier.findFirst.mockResolvedValue({ id: 's-1' });
      prisma.supplier.update.mockResolvedValue({ id: 's-1', name: 'Updated' });

      const result = await service.update(orgId, 's-1', { name: 'Updated' } as any);
      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException if supplier not in org', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);
      await expect(service.update(orgId, 'missing', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('should set status to INACTIVE', async () => {
      prisma.supplier.findFirst.mockResolvedValue({ id: 's-1' });
      prisma.supplier.update.mockResolvedValue({ id: 's-1', status: 'INACTIVE' });

      const result = await service.softDelete(orgId, 's-1');
      expect(result.status).toBe('INACTIVE');
      expect(prisma.supplier.update).toHaveBeenCalledWith({
        where: { id: 's-1' },
        data: { status: 'INACTIVE' },
      });
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);
      await expect(service.softDelete(orgId, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createContact', () => {
    it('should create contact after verifying supplier ownership', async () => {
      prisma.supplier.findFirst.mockResolvedValue({ id: 's-1' });
      const contact = { id: 'c-1', name: 'John', supplierId: 's-1' };
      prisma.contact.create.mockResolvedValue(contact);

      const result = await service.createContact(orgId, 's-1', { name: 'John' } as any);
      expect(result).toEqual(contact);
    });

    it('should throw NotFoundException if supplier not in org', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);
      await expect(
        service.createContact(orgId, 'missing', { name: 'John' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateContact', () => {
    it('should update contact after verifying ownership', async () => {
      prisma.contact.findFirst.mockResolvedValue({ id: 'c-1' });
      prisma.contact.update.mockResolvedValue({ id: 'c-1', name: 'Jane' });

      const result = await service.updateContact(orgId, 'c-1', { name: 'Jane' } as any);
      expect(result.name).toBe('Jane');
    });

    it('should throw ForbiddenException if contact not in org', async () => {
      prisma.contact.findFirst.mockResolvedValue(null);
      await expect(
        service.updateContact(orgId, 'missing', { name: 'Jane' } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteContact', () => {
    it('should delete contact after verifying ownership', async () => {
      prisma.contact.findFirst.mockResolvedValue({ id: 'c-1' });
      prisma.contact.delete.mockResolvedValue({});

      await service.deleteContact(orgId, 'c-1');
      expect(prisma.contact.delete).toHaveBeenCalledWith({ where: { id: 'c-1' } });
    });

    it('should throw ForbiddenException if contact not in org', async () => {
      prisma.contact.findFirst.mockResolvedValue(null);
      await expect(service.deleteContact(orgId, 'missing')).rejects.toThrow(ForbiddenException);
    });
  });
});
