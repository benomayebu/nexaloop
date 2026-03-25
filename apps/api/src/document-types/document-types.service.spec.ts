import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { DocumentTypesService } from './document-types.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrisma, MockPrisma } from '../test/prisma.mock';

describe('DocumentTypesService', () => {
  let service: DocumentTypesService;
  let prisma: MockPrisma;
  const orgId = 'org-1';

  beforeEach(async () => {
    prisma = createMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentTypesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<DocumentTypesService>(DocumentTypesService);
  });

  describe('list', () => {
    it('should return active document types for org', async () => {
      const types = [{ id: 'dt-1', name: 'BSCI Audit', isActive: true }];
      prisma.documentType.findMany.mockResolvedValue(types);

      const result = await service.list(orgId);
      expect(result).toEqual(types);
      expect(prisma.documentType.findMany).toHaveBeenCalledWith({
        where: { orgId, isActive: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('create', () => {
    it('should create document type with org scope', async () => {
      const dto = { name: 'GOTS Certificate', requiredForSupplierTypes: ['MILL'] };
      prisma.documentType.create.mockResolvedValue({ id: 'dt-1', ...dto, orgId });

      const result = await service.create(orgId, dto as any);
      expect(result.name).toBe('GOTS Certificate');
    });

    it('should default requiredForSupplierTypes to empty array', async () => {
      const dto = { name: 'Custom Type' };
      prisma.documentType.create.mockResolvedValue({ id: 'dt-1', ...dto, orgId });

      await service.create(orgId, dto as any);
      expect(prisma.documentType.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ requiredForSupplierTypes: [] }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update document type fields', async () => {
      prisma.documentType.findFirst.mockResolvedValue({ id: 'dt-1' });
      prisma.documentType.update.mockResolvedValue({ id: 'dt-1', name: 'Updated' });

      const result = await service.update(orgId, 'dt-1', { name: 'Updated' } as any);
      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.documentType.findFirst.mockResolvedValue(null);
      await expect(service.update(orgId, 'missing', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('should set isActive to false if not in use', async () => {
      prisma.documentType.findFirst.mockResolvedValue({ id: 'dt-1' });
      prisma.document.count.mockResolvedValue(0);
      prisma.documentType.update.mockResolvedValue({ id: 'dt-1', isActive: false });

      await service.softDelete(orgId, 'dt-1');
      expect(prisma.documentType.update).toHaveBeenCalledWith({
        where: { id: 'dt-1' },
        data: { isActive: false },
      });
    });

    it('should throw ConflictException if document type is in use', async () => {
      prisma.documentType.findFirst.mockResolvedValue({ id: 'dt-1' });
      prisma.document.count.mockResolvedValue(3);

      await expect(service.softDelete(orgId, 'dt-1')).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.documentType.findFirst.mockResolvedValue(null);
      await expect(service.softDelete(orgId, 'missing')).rejects.toThrow(NotFoundException);
    });
  });
});
