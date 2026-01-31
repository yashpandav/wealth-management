-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'INVESTMENT_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'INVESTMENT_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'INVESTMENT_DELETE';
ALTER TYPE "AuditAction" ADD VALUE 'INVESTMENT_OPTION_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'INVESTMENT_OPTION_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'INVESTMENT_OPTION_DELETE';

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";

-- AlterTable
ALTER TABLE "audit_logs" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
