-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('TRIAL', 'BASIC', 'PRO');
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'TRIAL',
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "maxUsers" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- All pre-existing data belongs to the original company: a PRO, non-expiring tenant.
INSERT INTO "Tenant" ("id", "name", "plan", "status", "expiresAt", "maxUsers", "createdAt", "updatedAt")
VALUES ('tenant_default', 'Viandes Corona', 'PRO', 'ACTIVE', NULL, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- User (tenantId nullable: super admins belong to no tenant)
ALTER TABLE "User" ADD COLUMN "tenantId" TEXT;
UPDATE "User" SET "tenantId" = 'tenant_default';

-- Tenant-owned tables: add, backfill, then require
ALTER TABLE "Customer" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Product" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "StockMovement" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Order" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "ActivityLog" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Expense" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Setting" ADD COLUMN "tenantId" TEXT;

UPDATE "Customer" SET "tenantId" = 'tenant_default';
UPDATE "Product" SET "tenantId" = 'tenant_default';
UPDATE "StockMovement" SET "tenantId" = 'tenant_default';
UPDATE "Order" SET "tenantId" = 'tenant_default';
UPDATE "ActivityLog" SET "tenantId" = 'tenant_default';
UPDATE "Supplier" SET "tenantId" = 'tenant_default';
UPDATE "Expense" SET "tenantId" = 'tenant_default';
UPDATE "Setting" SET "tenantId" = 'tenant_default';

ALTER TABLE "Customer" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "StockMovement" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "ActivityLog" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Supplier" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Expense" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Setting" ALTER COLUMN "tenantId" SET NOT NULL;

-- Setting was a global singleton row; it's now one row per tenant
ALTER TABLE "Setting" ALTER COLUMN "id" DROP DEFAULT;

-- Uniqueness is now per tenant
DROP INDEX "Order_orderNumber_key";
DROP INDEX "Product_barcode_key";
CREATE UNIQUE INDEX "Order_tenantId_orderNumber_key" ON "Order"("tenantId", "orderNumber");
CREATE UNIQUE INDEX "Product_tenantId_barcode_key" ON "Product"("tenantId", "barcode");
CREATE UNIQUE INDEX "Setting_tenantId_key" ON "Setting"("tenantId");

-- Indexes
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX "Customer_tenantId_idx" ON "Customer"("tenantId");
CREATE INDEX "Product_tenantId_idx" ON "Product"("tenantId");
CREATE INDEX "StockMovement_tenantId_idx" ON "StockMovement"("tenantId");
CREATE INDEX "Order_tenantId_idx" ON "Order"("tenantId");
CREATE INDEX "ActivityLog_tenantId_idx" ON "ActivityLog"("tenantId");
CREATE INDEX "Supplier_tenantId_idx" ON "Supplier"("tenantId");
CREATE INDEX "Expense_tenantId_idx" ON "Expense"("tenantId");

-- Foreign keys
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
