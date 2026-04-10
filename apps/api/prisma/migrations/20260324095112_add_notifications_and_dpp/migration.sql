-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('DOCUMENT_EXPIRING', 'DOCUMENT_EXPIRED', 'DOCUMENT_UPLOADED', 'DOCUMENT_REVIEWED', 'SYSTEM');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "countryOfOrigin" TEXT,
ADD COLUMN     "dppEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "manufacturingDate" TIMESTAMP(3),
ADD COLUMN     "materialComposition" TEXT,
ADD COLUMN     "recycledContent" DOUBLE PRECISION,
ADD COLUMN     "repairabilityScore" INTEGER,
ADD COLUMN     "weight" DOUBLE PRECISION,
ADD COLUMN     "weightUnit" TEXT DEFAULT 'kg';

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "entityType" TEXT,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_orgId_createdAt_idx" ON "Notification"("orgId", "createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
