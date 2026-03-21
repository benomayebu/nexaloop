import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage/storage.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentStatus } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async upload(
    orgId: string,
    userId: string,
    supplierId: string,
    file: Express.Multer.File,
    dto: UploadDocumentDto,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // 1. Verify the supplier belongs to this org (prevents cross-org attachment)
    await this.verifySupplierOwnership(orgId, supplierId);

    // 2. Verify the document type belongs to this org (prevents Org A from
    //    attaching Org B's document type to their supplier)
    await this.verifyDocumentTypeOwnership(orgId, dto.documentTypeId);

    // 3. Persist the file — mimeType is taken from multer (server-detected),
    //    never from the request body
    const { fileUrl, filename, mimeType } =
      await this.storageService.saveFile(file);

    // 4. Create the document record, setting uploadedByUserId from the
    //    authenticated user, not from the request body
    return this.prisma.document.create({
      data: {
        orgId,
        supplierId,
        documentTypeId: dto.documentTypeId,
        fileUrl,
        filename,
        mimeType,
        issuedDate: dto.issuedDate ? new Date(dto.issuedDate) : null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        status: DocumentStatus.PENDING_REVIEW,
        uploadedByUserId: userId,
      },
    });
  }

  async listForSupplier(orgId: string, supplierId: string) {
    // Verify the supplier belongs to this org before returning its documents
    await this.verifySupplierOwnership(orgId, supplierId);

    return this.prisma.document.findMany({
      where: { orgId, supplierId },
      include: {
        documentType: true,
        uploadedBy: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async update(
    orgId: string,
    documentId: string,
    userId: string,
    dto: UpdateDocumentDto,
  ) {
    // Scope the lookup by orgId — prevents a user from updating another org's document
    const existing = await this.prisma.document.findFirst({
      where: { id: documentId, orgId },
    });
    if (!existing) {
      throw new NotFoundException('Document not found');
    }

    // Set reviewedByUserId from the authenticated user when approving or
    // rejecting — it is NEVER taken from the request body
    const reviewedByUserId =
      dto.status === DocumentStatus.APPROVED ||
      dto.status === DocumentStatus.REJECTED
        ? userId
        : undefined;

    return this.prisma.document.update({
      where: { id: documentId },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.reviewNotes !== undefined
          ? { reviewNotes: dto.reviewNotes }
          : {}),
        ...(dto.issuedDate !== undefined
          ? { issuedDate: new Date(dto.issuedDate) }
          : {}),
        ...(dto.expiryDate !== undefined
          ? { expiryDate: new Date(dto.expiryDate) }
          : {}),
        ...(reviewedByUserId !== undefined ? { reviewedByUserId } : {}),
      },
    });
  }

  // --- Private helpers ---

  private async verifySupplierOwnership(
    orgId: string,
    supplierId: string,
  ): Promise<void> {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, orgId },
    });
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }
  }

  private async verifyDocumentTypeOwnership(
    orgId: string,
    documentTypeId: string,
  ): Promise<void> {
    const documentType = await this.prisma.documentType.findFirst({
      where: { id: documentTypeId, orgId, isActive: true },
    });
    if (!documentType) {
      throw new NotFoundException('Document type not found');
    }
  }
}
