-- AlterTable: add workspace fields to Organization
ALTER TABLE "Organization" ADD COLUMN "website" TEXT;
ALTER TABLE "Organization" ADD COLUMN "address" TEXT;
ALTER TABLE "Organization" ADD COLUMN "currency" TEXT DEFAULT 'EUR';
