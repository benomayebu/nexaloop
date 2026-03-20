-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('TIER1_FACTORY', 'MILL', 'SPINNER', 'DYEHOUSE', 'TRIM_SUPPLIER', 'AGENT', 'OTHER');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PROSPECT');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'UNKNOWN');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "dummy" TEXT;
ALTER TABLE "Organization" DROP COLUMN IF EXISTS "dummy";

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "supplierCode" TEXT,
    "type" "SupplierType" NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "status" "SupplierStatus" NOT NULL DEFAULT 'ACTIVE',
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'UNKNOWN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
