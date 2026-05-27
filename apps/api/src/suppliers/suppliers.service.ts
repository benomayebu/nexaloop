import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupplierType, SupplierStatus, RiskLevel } from '@prisma/client';
import { parseCsv } from '../common/parse-csv';
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
        documents: {
          where: { orgId },
          select: { id: true, status: true, expiryDate: true },
        },
        productLinks: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, category: true, status: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { documents: true } },
      },
    });
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    const now = new Date();
    const docs = supplier.documents;
    const approved = docs.filter((d) => d.status === 'APPROVED').length;
    const pending = docs.filter((d) => d.status === 'PENDING_REVIEW').length;
    const total = docs.length;
    const complianceScore =
      total > 0 ? Math.round((approved / total) * 100) : null;

    const { documents: _docs, ...rest } = supplier;
    return {
      ...rest,
      complianceScore,
      _docStats: { total, approved, pending },
    };
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

  async importCsv(orgId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('CSV file is required');

    const text = file.buffer.toString('utf-8');
    const rows = parseCsv(text);
    if (rows.length === 0) throw new BadRequestException('CSV file is empty or has no data rows');

    const VALID_TYPES = Object.values(SupplierType);
    const VALID_STATUSES = Object.values(SupplierStatus);
    const VALID_RISKS = Object.values(RiskLevel);

    const TYPE_ALIASES: Record<string, SupplierType> = {
      'tier 1 factory': SupplierType.TIER1_FACTORY,
      'tier1 factory': SupplierType.TIER1_FACTORY,
      factory: SupplierType.TIER1_FACTORY,
      mill: SupplierType.MILL,
      spinner: SupplierType.SPINNER,
      dyehouse: SupplierType.DYEHOUSE,
      dye: SupplierType.DYEHOUSE,
      trim: SupplierType.TRIM_SUPPLIER,
      'trim supplier': SupplierType.TRIM_SUPPLIER,
      agent: SupplierType.AGENT,
      other: SupplierType.OTHER,
    };

    const created: { row: number; name: string; id: string }[] = [];
    const skipped: { row: number; name: string; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNum = i + 2;
      const name = r['name'] ?? r['supplier name'] ?? r['supplier'] ?? '';
      const country = r['country'] ?? r['country code'] ?? '';
      const rawType = (r['type'] ?? r['supplier type'] ?? 'OTHER').toUpperCase().replace(/\s+/g, '_');
      const rawStatus = (r['status'] ?? '').toUpperCase().replace(/\s+/g, '_');
      const rawRisk = (r['risk'] ?? r['risk level'] ?? r['risklevel'] ?? '').toUpperCase();
      const code = r['code'] ?? r['supplier code'] ?? r['suppliercode'] ?? '';
      const city = r['city'] ?? '';
      const notes = r['notes'] ?? '';

      if (!name) {
        skipped.push({ row: rowNum, name: '(empty)', reason: 'Missing name' });
        continue;
      }
      if (!country) {
        skipped.push({ row: rowNum, name, reason: 'Missing country' });
        continue;
      }

      const type = VALID_TYPES.includes(rawType as SupplierType)
        ? (rawType as SupplierType)
        : TYPE_ALIASES[rawType.toLowerCase().replace(/_/g, ' ')] ?? SupplierType.OTHER;

      const status = VALID_STATUSES.includes(rawStatus as SupplierStatus)
        ? (rawStatus as SupplierStatus)
        : SupplierStatus.ACTIVE;

      const riskLevel = VALID_RISKS.includes(rawRisk as RiskLevel)
        ? (rawRisk as RiskLevel)
        : RiskLevel.UNKNOWN;

      try {
        const supplier = await this.prisma.supplier.create({
          data: {
            orgId,
            name,
            type,
            country: country.toUpperCase().slice(0, 2),
            supplierCode: code || null,
            city: city || null,
            status,
            riskLevel,
            notes: notes || null,
          },
        });
        created.push({ row: rowNum, name, id: supplier.id });
      } catch (err: any) {
        const reason = err?.code === 'P2002' ? 'Duplicate entry' : (err?.message ?? 'Unknown error');
        skipped.push({ row: rowNum, name, reason });
      }
    }

    return { totalRows: rows.length, created: created.length, skipped: skipped.length, createdItems: created, skippedItems: skipped };
  }
}
