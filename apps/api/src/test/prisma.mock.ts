/**
 * Shared mock factory for PrismaService.
 * Each test calls createMockPrisma() to get a fresh set of jest.fn() stubs.
 */
export function createMockPrisma() {
  return {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    organization: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    userOrganization: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    supplier: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    contact: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    documentType: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    document: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    productSupplier: {
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    notification: {
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((cb: (tx: unknown) => Promise<unknown>) => {
      // By default, pass the mock prisma itself as the transaction client
      // Tests can override this behavior
      return cb({
        organization: { create: jest.fn() },
        user: { create: jest.fn() },
        userOrganization: { create: jest.fn() },
      });
    }),
  };
}

export type MockPrisma = ReturnType<typeof createMockPrisma>;
