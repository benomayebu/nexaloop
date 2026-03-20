import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupplierType, SupplierStatus, RiskLevel } from '@prisma/client';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    orgId: string,
    filters: {
      type?: SupplierType;
      status?: SupplierStatus;
      riskLevel?: RiskLevel;
      q?: string;
    },
  ) {
    return this.prisma.supplier.findMany({
      where: {
        orgId,
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.riskLevel ? { riskLevel: filters.riskLevel } : {}),
        ...(filters.q
          ? {
              OR: [
                { name: { contains: filters.q, mode: 'insensitive' } },
                { supplierCode: { contains: filters.q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(orgId: string, dto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: {
        orgId,
        name: dto.name,
        type: dto.type,
        country: dto.country,
        supplierCode: dto.supplierCode,
        city: dto.city,
        status: dto.status,
        riskLevel: dto.riskLevel,
        notes: dto.notes,
      },
    });
  }

  async findOne(orgId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, orgId },
      include: { contacts: { orderBy: { createdAt: 'asc' } } },
    });
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }
    return supplier;
  }

  async update(orgId: string, id: string, dto: UpdateSupplierDto) {
    const existing = await this.prisma.supplier.findFirst({
      where: { id, orgId },
    });
    if (!existing) {
      throw new NotFoundException('Supplier not found');
    }
    return this.prisma.supplier.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        country: dto.country,
        supplierCode: dto.supplierCode,
        city: dto.city,
        status: dto.status,
        riskLevel: dto.riskLevel,
        notes: dto.notes,
      },
    });
  }

  async softDelete(orgId: string, id: string) {
    const existing = await this.prisma.supplier.findFirst({
      where: { id, orgId },
    });
    if (!existing) {
      throw new NotFoundException('Supplier not found');
    }
    return this.prisma.supplier.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  // --- Contact methods ---

  async createContact(
    orgId: string,
    supplierId: string,
    dto: CreateContactDto,
  ) {
    await this.verifySupplierOwnership(orgId, supplierId);
    return this.prisma.contact.create({
      data: {
        supplierId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        role: dto.role,
      },
    });
  }

  async updateContact(
    orgId: string,
    contactId: string,
    dto: UpdateContactDto,
  ) {
    await this.verifyContactOwnership(orgId, contactId);
    return this.prisma.contact.update({
      where: { id: contactId },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        role: dto.role,
      },
    });
  }

  async deleteContact(orgId: string, contactId: string) {
    await this.verifyContactOwnership(orgId, contactId);
    await this.prisma.contact.delete({ where: { id: contactId } });
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

  private async verifyContactOwnership(
    orgId: string,
    contactId: string,
  ): Promise<void> {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: contactId,
        supplier: { orgId },
      },
    });
    if (!contact) {
      throw new ForbiddenException('Contact not found or access denied');
    }
  }
}
