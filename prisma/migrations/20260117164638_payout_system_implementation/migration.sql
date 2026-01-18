-- Migration: Payout System Implementation
-- Description: Replace WithdrawalRequest system with automated Payout & Interest Distribution system
-- Date: 2026-01-17

-- ===========================================
-- STEP 1: Create new enums
-- ===========================================

-- Create PayoutStatus enum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- Update TransactionType enum to add INTEREST_PAYOUT
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'INTEREST_PAYOUT';

-- Update AuditAction enum to add payout-related actions
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PAYOUT_SCHEDULE_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PAYOUT_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PAYOUT_COMPLETED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PAYOUT_FAILED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PAYOUT_RECEIPT_UPLOADED';

-- ===========================================
-- STEP 2: Add new fields to existing tables
-- ===========================================

-- Add payoutWindow field to investment_purchase_requests
ALTER TABLE "investment_purchase_requests"
ADD COLUMN IF NOT EXISTS "payoutWindow" VARCHAR(10);

-- Add payout reference to transactions
ALTER TABLE "transactions"
ADD COLUMN IF NOT EXISTS "payoutId" TEXT UNIQUE;

-- ===========================================
-- STEP 3: Create new tables
-- ===========================================

-- Create payout_schedules table
CREATE TABLE IF NOT EXISTS "payout_schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productPurchaseRequestId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "interestAmount" DECIMAL(15,2) NOT NULL,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fk_payout_schedule_purchase_request"
        FOREIGN KEY ("productPurchaseRequestId")
        REFERENCES "investment_purchase_requests"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT "fk_payout_schedule_client"
        FOREIGN KEY ("clientId")
        REFERENCES "clients"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create unique constraint on payout_schedules
CREATE UNIQUE INDEX IF NOT EXISTS "payout_schedules_productPurchaseRequestId_scheduledDate_key"
    ON "payout_schedules"("productPurchaseRequestId", "scheduledDate");

-- Create indexes on payout_schedules
CREATE INDEX IF NOT EXISTS "payout_schedules_productPurchaseRequestId_idx" ON "payout_schedules"("productPurchaseRequestId");
CREATE INDEX IF NOT EXISTS "payout_schedules_clientId_idx" ON "payout_schedules"("clientId");
CREATE INDEX IF NOT EXISTS "payout_schedules_scheduledDate_idx" ON "payout_schedules"("scheduledDate");
CREATE INDEX IF NOT EXISTS "payout_schedules_isProcessed_idx" ON "payout_schedules"("isProcessed");

-- Create payouts table
CREATE TABLE IF NOT EXISTS "payouts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productPurchaseRequestId" TEXT NOT NULL,
    "payoutScheduleId" TEXT NOT NULL UNIQUE,
    "clientId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "processedById" TEXT,
    "processedAt" TIMESTAMP(3),
    "receiptDocumentId" TEXT UNIQUE,
    "transactionId" TEXT UNIQUE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fk_payout_purchase_request"
        FOREIGN KEY ("productPurchaseRequestId")
        REFERENCES "investment_purchase_requests"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT "fk_payout_schedule"
        FOREIGN KEY ("payoutScheduleId")
        REFERENCES "payout_schedules"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT "fk_payout_client"
        FOREIGN KEY ("clientId")
        REFERENCES "clients"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT "fk_payout_processor"
        FOREIGN KEY ("processedById")
        REFERENCES "users"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT "fk_payout_receipt"
        FOREIGN KEY ("receiptDocumentId")
        REFERENCES "documents"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT "fk_payout_transaction"
        FOREIGN KEY ("transactionId")
        REFERENCES "transactions"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create indexes on payouts
CREATE INDEX IF NOT EXISTS "payouts_productPurchaseRequestId_idx" ON "payouts"("productPurchaseRequestId");
CREATE INDEX IF NOT EXISTS "payouts_clientId_idx" ON "payouts"("clientId");
CREATE INDEX IF NOT EXISTS "payouts_status_idx" ON "payouts"("status");
CREATE INDEX IF NOT EXISTS "payouts_scheduledDate_idx" ON "payouts"("scheduledDate");
CREATE INDEX IF NOT EXISTS "payouts_processedById_idx" ON "payouts"("processedById");

-- ===========================================
-- STEP 4: Add foreign key constraint for transactions.payoutId
-- ===========================================

ALTER TABLE "transactions"
ADD CONSTRAINT "fk_transaction_payout"
    FOREIGN KEY ("payoutId")
    REFERENCES "payouts"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ===========================================
-- STEP 5: Drop withdrawal-related constraints and columns
-- ===========================================

-- Drop foreign key constraints first
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_withdrawalRequestId_fkey";

-- Drop withdrawal-related columns from transactions
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "withdrawalRequestId";

-- ===========================================
-- STEP 6: Drop withdrawal_requests table
-- ===========================================

-- WARNING: This will delete all existing withdrawal request data
-- Make sure to backup the data before running this migration if needed
DROP TABLE IF EXISTS "withdrawal_requests" CASCADE;

-- ===========================================
-- STEP 7: Drop WithdrawalStatus enum
-- ===========================================

-- Drop the enum type (will fail if still referenced)
DROP TYPE IF EXISTS "WithdrawalStatus";

-- ===========================================
-- STEP 8: Add comments for documentation
-- ===========================================

COMMENT ON TABLE "payout_schedules" IS 'Auto-generated payout schedule for investment contracts';
COMMENT ON TABLE "payouts" IS 'Actual payout execution records processed by DocAdmin';
COMMENT ON COLUMN "investment_purchase_requests"."payoutWindow" IS 'Payout window selected by RM: 1-15 or 16-30';
COMMENT ON COLUMN "transactions"."payoutId" IS 'Reference to payout for INTEREST_PAYOUT transactions';
