-- CreateEnum
CREATE TYPE "RoleTier" AS ENUM ('SYSTEM_ADMIN', 'OFFICE_ADMIN', 'STAFF', 'CUSTOM');

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tier" "RoleTier" NOT NULL DEFAULT 'CUSTOM';

-- CreateIndex
CREATE INDEX "roles_tier_idx" ON "roles"("tier");

-- CreateIndex
CREATE INDEX "roles_isBuiltIn_idx" ON "roles"("isBuiltIn");

-- Backfill existing built-in roles
UPDATE "roles" SET "isBuiltIn" = true, "tier" = 'SYSTEM_ADMIN' WHERE "slug" = 'super-admin';
UPDATE "roles" SET "isBuiltIn" = true, "tier" = 'OFFICE_ADMIN' WHERE "slug" = 'office-admin';
UPDATE "roles" SET "isBuiltIn" = true, "tier" = 'STAFF' WHERE "slug" = 'staff';
UPDATE "roles" SET "isBuiltIn" = true, "tier" = 'CUSTOM' WHERE "slug" IN ('site-admin', 'office-editor', 'approver');

