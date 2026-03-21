import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';

@Injectable()
export class DocumentTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(orgId: string) {
    return this.prisma.documentType.findMany({
      where: { orgId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(orgId: string, dto: CreateDocumentTypeDto) {
    return this.prisma.documentType.create({
      data: {
        orgId,
        name: dto.name,
        description: dto.description,
        requiredForSupplierTypes: dto.requiredForSupplierTypes ?? [],
      },
    });
  }

  async update(orgId: string, id: string, dto: UpdateDocumentTypeDto) {
    const existing = await this.prisma.documentType.findFirst({
      where: { id, orgId },
    });
    if (!existing) {
      throw new NotFoundException('Document type not found');
    }
    return this.prisma.documentType.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        ...(dto.requiredForSupplierTypes !== undefined
          ? { requiredForSupplierTypes: dto.requiredForSupplierTypes }
          : {}),
      },
    });
  }

  async softDelete(orgId: string, id: string): Promise<void> {
    const existing = await this.prisma.documentType.findFirst({
      where: { id, orgId },
    });
    if (!existing) {
      throw new NotFoundException('Document type not found');
    }
    const inUse = await this.prisma.document.count({
      where: { documentTypeId: id },
    });
    if (inUse > 0) {
      throw new ConflictException(
        'Document type is in use and cannot be deleted',
      );
    }
    await this.prisma.documentType.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
