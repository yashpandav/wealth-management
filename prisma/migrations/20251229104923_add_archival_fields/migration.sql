-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'CLIENT_ARCHIVE';
ALTER TYPE "AuditAction" ADD VALUE 'CLIENT_RESTORE';

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "archivedReason" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "users_isArchived_idx" ON "users"("isArchived");
