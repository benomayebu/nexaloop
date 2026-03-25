import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage/storage.service';
import { createMockPrisma, MockPrisma } from '../test/prisma.mock';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let prisma: MockPrisma;
  let storageService: { saveFile: jest.Mock };
  const orgId = 'org-1';
  const userId = 'user-1';

  beforeEach(async () => {
    prisma = createMockPrisma();
    storageService = {
      saveFile: jest.fn().mockResolvedValue({
        fileUrl: '/uploads/abc.pdf',
        filename: 'abc.pdf',
        mimeType: 'application/pdf',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storageService },
      ],
    }).compile();
    service = module.get<DocumentsService>(DocumentsService);
  });

  describe('upload', () => {
    const mockFile = { buffer: Buffer.from('test'), mimetype: 'application/pdf' } as Express.Multer.File;
    const dto = { documentTypeId: 'dt-1' };

    it('should upload document with server-detected mimeType', async () => {
      prisma.supplier.findFirst.mockResolvedValue({ id: 's-1' });
      prisma.documentType.findFirst.mockResolvedValue({ id: 'dt-1' });
      prisma.document.create.mockResolvedValue({ id: 'doc-1', uploadedByUserId: userId });

      const result = await service.upload(orgId, userId, 's-1', mockFile, dto as any);

      expect(result.uploadedByUserId).toBe(userId);
      expect(storageService.saveFile).toHaveBeenCalledWith(mockFile);
      expect(prisma.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId,
            supplierId: 's-1',
            uploadedByUserId: userId,
            mimeType: 'application/pdf',
            status: 'PENDING_REVIEW',
          }),
        }),
      );
    });

    it('should throw BadRequestException if no file provided', async () => {
      await expect(
        service.upload(orgId, userId, 's-1', null as any, dto as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if supplier not in org', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);
      await expect(
        service.upload(orgId, userId, 'missing', mockFile, dto as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if document type not in org', async () => {
      prisma.supplier.findFirst.mockResolvedValue({ id: 's-1' });
      prisma.documentType.findFirst.mockResolvedValue(null);
      await expect(
        service.upload(orgId, userId, 's-1', mockFile, dto as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listForSupplier', () => {
    it('should return documents for a verified supplier', async () => {
      prisma.supplier.findFirst.mockResolvedValue({ id: 's-1' });
      const docs = [{ id: 'doc-1' }];
      prisma.document.findMany.mockResolvedValue(docs);

      const result = await service.listForSupplier(orgId, 's-1');
      expect(result).toEqual(docs);
    });

    it('should throw NotFoundException if supplier not in org', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);
      await expect(service.listForSupplier(orgId, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update status and set reviewedByUserId on approval', async () => {
      prisma.document.findFirst.mockResolvedValue({ id: 'doc-1' });
      prisma.document.update.mockResolvedValue({ id: 'doc-1', status: 'APPROVED' });

      await service.update(orgId, 'doc-1', userId, { status: 'APPROVED' as any });

      expect(prisma.document.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'APPROVED',
            reviewedByUserId: userId,
          }),
        }),
      );
    });

    it('should set reviewedByUserId on rejection', async () => {
      prisma.document.findFirst.mockResolvedValue({ id: 'doc-1' });
      prisma.document.update.mockResolvedValue({ id: 'doc-1', status: 'REJECTED' });

      await service.update(orgId, 'doc-1', userId, { status: 'REJECTED' as any });

      const updateCall = prisma.document.update.mock.calls[0][0];
      expect(updateCall.data.reviewedByUserId).toBe(userId);
    });

    it('should NOT set reviewedByUserId for non-review status changes', async () => {
      prisma.document.findFirst.mockResolvedValue({ id: 'doc-1' });
      prisma.document.update.mockResolvedValue({ id: 'doc-1' });

      await service.update(orgId, 'doc-1', userId, { reviewNotes: 'updated notes' } as any);

      const updateCall = prisma.document.update.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('reviewedByUserId');
    });

    it('should throw NotFoundException if document not in org', async () => {
      prisma.document.findFirst.mockResolvedValue(null);
      await expect(
        service.update(orgId, 'missing', userId, {} as any),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
