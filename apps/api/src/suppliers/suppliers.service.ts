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
    const now = new Date();
    const thirtyDays = new Date(now);
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    const suppliers = await this.prisma.supplier.findMany({
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
                { city: { contains: filters.q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        documents: {
          where: { orgId },
          select: { status: true, expiryDate: true },
        },
        _count: { select: { documents: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return suppliers.map((sup) => {
      const docs = sup.documents;
      const approved = docs.filter((d) => d.status === 'APPROVED').length;
      const pending = docs.filter((d) => d.status === 'PENDING_REVIEW').length;
      const expiring = docs.filter(
        (d) =>
          d.status === 'APPROVED' &&
          d.expiryDate &&
          d.expiryDate >= now &&
          d.expiryDate <= thirtyDays,
      ).length;
      const expired = docs.filter(
        (d) =>
          (d.status === 'EXPIRED') ||
          (d.status === 'APPROVED' && d.expiryDate && d.expiryDate < now),
      ).length;
      const total = docs.length;
      const complianceScore =
        total > 0 ? Math.round((approved / total) * 100) : null;

      const { documents: _docs, ...rest } = sup;
      return {
        ...rest,
        complianceScore,
        _pending: pending,
        _expiring: expiring,
        _expired: expired,
      };
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
      include: {
        contacts: { orderBy: { createdAt: 'asc' } },
        productLinks: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, category: true, status: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
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
