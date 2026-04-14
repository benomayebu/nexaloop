import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentStatus } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    @Optional() private readonly notificationsService: NotificationsService,
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
    const supplier = await this.verifySupplierOwnership(orgId, supplierId);

    // 2. Verify the document type belongs to this org
    const documentType = await this.verifyDocumentTypeOwnership(
      orgId,
      dto.documentTypeId,
    );

    // 3. Persist the file — mimeType from multer (server-detected), never from body
    const { fileUrl, filename, mimeType } =
      await this.storageService.saveFile(file);

    // 4. Create the document record — uploadedByUserId from authenticated user,
    //    never from the request body (security-engineer rule)
    const document = await this.prisma.document.create({
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

    // 5. Notify the org that a new document is awaiting review (fire-and-forget)
    this.notificationsService
      ?.notifyOrg(orgId, {
        type: 'DOCUMENT_UPLOADED',
        title: 'New Document Uploaded',
        message: `${documentType.name} for ${supplier.name} has been uploaded and is pending review.`,
        entityType: 'document',
        entityId: document.id,
      })
      .catch(() => void 0);

    return document;
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
      include: {
        documentType: { select: { name: true } },
        supplier: { select: { name: true } },
      },
    });
    if (!existing) {
      throw new NotFoundException('Document not found');
    }

    const isReview =
      dto.status === DocumentStatus.APPROVED ||
      dto.status === DocumentStatus.REJECTED;

    // reviewedByUserId from the authenticated user only — never from DTO
    const reviewedByUserId = isReview ? userId : undefined;

    const updated = await this.prisma.document.update({
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

    // Notify org when a document is approved or rejected (fire-and-forget)
    if (isReview) {
      const action =
        dto.status === DocumentStatus.APPROVED ? 'approved' : 'rejected';
      this.notificationsService
        ?.notifyOrg(orgId, {
          type: 'DOCUMENT_REVIEWED',
          title: `Document ${action.charAt(0).toUpperCase() + action.slice(1)}`,
          message: `${existing.documentType.name} for ${existing.supplier.name} has been ${action}.`,
          entityType: 'document',
          entityId: documentId,
        })
        .catch(() => void 0);
    }

    return updated;
  }

  async getForDownload(orgId: string, documentId: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, orgId },
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    return {
      doc,
      downloadUrl: await this.storageService.getDownloadUrl(doc.fileUrl),
    };
  }

  // ── Private helpers ──────────────────────────────────────────────

  private async verifySupplierOwnership(
    orgId: string,
    supplierId: string,
  ): Promise<{ name: string }> {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, orgId },
      select: { name: true },
    });
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }
    return supplier;
  }

  private async verifyDocumentTypeOwnership(
    orgId: string,
    documentTypeId: string,
  ): Promise<{ name: string }> {
    const documentType = await this.prisma.documentType.findFirst({
      where: { id: documentTypeId, orgId, isActive: true },
      select: { name: true },
    });
    if (!documentType) {
      throw new NotFoundException('Document type not found');
    }
    return documentType;
  }
}
