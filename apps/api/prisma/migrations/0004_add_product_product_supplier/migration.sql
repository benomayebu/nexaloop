-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "ProductSupplierRole" AS ENUM ('CUT_AND_SEW', 'FABRIC_SUPPLIER', 'YARN_SUPPLIER', 'TRIM_SUPPLIER', 'PACKAGING', 'OTHER');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT,
    "season" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSupplier" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "role" "ProductSupplierRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_orgId_sku_key" ON "Product"("orgId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSupplier_productId_supplierId_role_key" ON "ProductSupplier"("productId", "supplierId", "role");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSupplier" ADD CONSTRAINT "ProductSupplier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSupplier" ADD CONSTRAINT "ProductSupplier_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
