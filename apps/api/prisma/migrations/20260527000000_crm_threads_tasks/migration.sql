-- AlterEnum: add VETTING and ONBOARDING to SupplierStatus
ALTER TYPE "SupplierStatus" ADD VALUE 'VETTING';
ALTER TYPE "SupplierStatus" ADD VALUE 'ONBOARDING';

-- CreateEnum
CREATE TYPE "CrmThreadStatus" AS ENUM ('OPEN', 'RESOLVED');
CREATE TYPE "CrmMessageAuthorType" AS ENUM ('INTERNAL', 'EXTERNAL');
CREATE TYPE "CrmTaskPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "CrmTaskStatus" AS ENUM ('OPEN', 'DONE');

-- CreateTable
CREATE TABLE "CrmThread" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "supplierId" TEXT,
    "contactId" TEXT,
    "subject" TEXT NOT NULL,
    "status" "CrmThreadStatus" NOT NULL DEFAULT 'OPEN',
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "authorType" "CrmMessageAuthorType" NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorUserId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmTask" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "supplierId" TEXT,
    "documentId" TEXT,
    "assigneeId" TEXT NOT NULL,
    "priority" "CrmTaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "CrmTaskStatus" NOT NULL DEFAULT 'OPEN',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CrmThread_orgId_status_idx" ON "CrmThread"("orgId", "status");
CREATE INDEX "CrmThread_orgId_lastMessageAt_idx" ON "CrmThread"("orgId", "lastMessageAt");
CREATE INDEX "CrmThread_supplierId_idx" ON "CrmThread"("supplierId");

CREATE INDEX "CrmMessage_threadId_createdAt_idx" ON "CrmMessage"("threadId", "createdAt");

CREATE INDEX "CrmTask_orgId_status_idx" ON "CrmTask"("orgId", "status");
CREATE INDEX "CrmTask_orgId_dueDate_idx" ON "CrmTask"("orgId", "dueDate");
CREATE INDEX "CrmTask_assigneeId_status_idx" ON "CrmTask"("assigneeId", "status");
CREATE INDEX "CrmTask_supplierId_idx" ON "CrmTask"("supplierId");

-- AddForeignKey
ALTER TABLE "CrmThread" ADD CONSTRAINT "CrmThread_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CrmThread" ADD CONSTRAINT "CrmThread_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmThread" ADD CONSTRAINT "CrmThread_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmThread" ADD CONSTRAINT "CrmThread_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CrmMessage" ADD CONSTRAINT "CrmMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "CrmThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmMessage" ADD CONSTRAINT "CrmMessage_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
