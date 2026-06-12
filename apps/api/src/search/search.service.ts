import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(orgId: string, query: string) {
    const q = query.trim();
    if (q.length < 2) {
      return { suppliers: [], products: [], documents: [], notes: [] };
    }

    const [suppliers, products, documents, notes] = await Promise.all([
      this.prisma.supplier.findMany({
        where: {
          orgId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { supplierCode: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, supplierCode: true, type: true, country: true },
        take: 5,
        orderBy: { name: 'asc' },
      }),

      this.prisma.product.findMany({
        where: {
          orgId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { sku: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, sku: true, category: true, season: true },
        take: 5,
        orderBy: { name: 'asc' },
      }),

      this.prisma.document.findMany({
        where: {
          orgId,
          OR: [
            { filename: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          filename: true,
          supplier: { select: { id: true, name: true } },
          documentType: { select: { name: true } },
        },
        take: 5,
        orderBy: { filename: 'asc' },
      }),

      this.prisma.crmThread.findMany({
        where: {
          orgId,
          subject: { contains: q, mode: 'insensitive' },
        },
        select: {
          id: true,
          subject: true,
          status: true,
          supplier: { select: { name: true } },
        },
        take: 5,
        orderBy: { lastMessageAt: 'desc' },
      }),
    ]);

    return {
      suppliers,
      products,
      documents: documents.map((d) => ({
        id: d.id,
        filename: d.filename,
        supplierId: d.supplier.id,
        supplierName: d.supplier.name,
        documentTypeName: d.documentType.name,
      })),
      notes: notes.map((n) => ({
        id: n.id,
        subject: n.subject,
        status: n.status,
        supplierName: n.supplier?.name ?? null,
      })),
    };
  }
}
