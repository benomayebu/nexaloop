import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrisma, MockPrisma } from '../test/prisma.mock';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: MockPrisma;
  const orgId = 'org-1';
  const userId = 'user-1';

  beforeEach(async () => {
    prisma = createMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('listForUser', () => {
    it('should return notifications ordered by createdAt desc', async () => {
      const notifications = [{ id: 'n-1', title: 'Test' }];
      prisma.notification.findMany.mockResolvedValue(notifications);

      const result = await service.listForUser(orgId, userId);
      expect(result).toEqual(notifications);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orgId, userId },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
      );
    });

    it('should filter unread only when requested', async () => {
      prisma.notification.findMany.mockResolvedValue([]);

      await service.listForUser(orgId, userId, true);

      const call = prisma.notification.findMany.mock.calls[0][0];
      expect(call.where.read).toBe(false);
    });
  });

  describe('unreadCount', () => {
    it('should return count of unread notifications', async () => {
      prisma.notification.count.mockResolvedValue(5);

      const result = await service.unreadCount(orgId, userId);
      expect(result).toBe(5);
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { orgId, userId, read: false },
      });
    });
  });

  describe('markRead', () => {
    it('should mark a specific notification as read', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 1 });

      await service.markRead(orgId, userId, 'n-1');
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'n-1', orgId, userId },
        data: { read: true },
      });
    });
  });

  describe('markAllRead', () => {
    it('should mark all unread notifications as read', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 5 });

      await service.markAllRead(orgId, userId);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { orgId, userId, read: false },
        data: { read: true },
      });
    });
  });

  describe('notifyOrg', () => {
    it('should create notifications for all org members', async () => {
      prisma.userOrganization.findMany.mockResolvedValue([
        { userId: 'u-1' },
        { userId: 'u-2' },
      ]);
      prisma.notification.createMany.mockResolvedValue({ count: 2 });

      await service.notifyOrg(orgId, {
        type: 'DOCUMENT_EXPIRED',
        title: 'Expired',
        message: 'A document has expired',
      });

      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: 'u-1', orgId }),
          expect.objectContaining({ userId: 'u-2', orgId }),
        ]),
      });
    });
  });

  describe('notifyUser', () => {
    it('should create notification for a single user', async () => {
      prisma.notification.create.mockResolvedValue({ id: 'n-1' });

      await service.notifyUser(orgId, userId, {
        type: 'SYSTEM',
        title: 'Welcome',
        message: 'Welcome to N.E.X.A Loop',
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orgId,
          userId,
          type: 'SYSTEM',
          title: 'Welcome',
        }),
      });
    });
  });

  describe('checkExpiringDocuments (cron)', () => {
    it('should mark expired documents and notify org', async () => {
      const expiredDoc = {
        id: 'doc-1',
        orgId,
        expiryDate: new Date('2020-01-01'),
        supplier: { name: 'Factory A' },
        documentType: { name: 'BSCI Audit' },
        org: { id: orgId, members: [{ userId: 'u-1' }] },
      };
      // expiring docs (within 30 days)
      prisma.document.findMany
        .mockResolvedValueOnce([]) // expiringDocs
        .mockResolvedValueOnce([expiredDoc]); // expiredDocs

      prisma.document.updateMany.mockResolvedValue({ count: 1 });
      prisma.userOrganization.findMany.mockResolvedValue([{ userId: 'u-1' }]);
      prisma.notification.createMany.mockResolvedValue({ count: 1 });

      await service.checkExpiringDocuments();

      // Should mark expired docs
      expect(prisma.document.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['doc-1'] } },
        data: { status: 'EXPIRED' },
      });
    });

    it('should send urgent warnings for docs expiring within 7 days', async () => {
      const soon = new Date();
      soon.setDate(soon.getDate() + 3); // 3 days from now

      const urgentDoc = {
        id: 'doc-2',
        orgId,
        expiryDate: soon,
        supplier: { name: 'Mill B' },
        documentType: { name: 'GOTS' },
        org: { id: orgId, members: [{ userId: 'u-1' }] },
      };

      prisma.document.findMany
        .mockResolvedValueOnce([urgentDoc]) // expiringDocs
        .mockResolvedValueOnce([]); // expiredDocs

      prisma.userOrganization.findMany.mockResolvedValue([{ userId: 'u-1' }]);
      prisma.notification.createMany.mockResolvedValue({ count: 1 });

      await service.checkExpiringDocuments();

      // Should notify about urgent doc
      expect(prisma.notification.createMany).toHaveBeenCalled();
    });
  });
});
