/*
  Warnings:

  - The values [INSTRUMENT_CREATE,INSTRUMENT_UPDATE,INSTRUMENT_DELETE,INSTRUMENT_ACTIVATE,INSTRUMENT_DEACTIVATE,PORTFOLIO_CREATE,PORTFOLIO_UPDATE,HOLDING_CREATE,HOLDING_UPDATE,HOLDING_DELETE] on the enum `AuditAction` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `instrumentId` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `purchaseRequestId` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the `holdings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `instruments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `portfolios` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `purchase_requests` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'MFA_ENABLE', 'MFA_DISABLE', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_ACTIVATE', 'USER_DEACTIVATE', 'CLIENT_ASSIGN', 'CLIENT_REASSIGN', 'PURCHASE_REQUEST_CREATE', 'PURCHASE_REQUEST_APPROVE', 'PURCHASE_REQUEST_REJECT', 'PURCHASE_REQUEST_CANCEL', 'WITHDRAWAL_REQUEST_CREATE', 'WITHDRAWAL_REQUEST_RM_APPROVE', 'WITHDRAWAL_REQUEST_RM_REJECT', 'WITHDRAWAL_REQUEST_ADMIN_APPROVE', 'WITHDRAWAL_REQUEST_ADMIN_REJECT', 'WITHDRAWAL_REQUEST_CANCEL', 'TRANSACTION_CREATE', 'TRANSACTION_REVERSE', 'TRANSACTION_FAIL', 'DOCUMENT_UPLOAD', 'DOCUMENT_VERIFY', 'DOCUMENT_REJECT', 'DOCUMENT_DELETE', 'CLIENT_VERIFICATION_STATUS_UPDATE', 'PAYOUT_SCHEDULE_CREATED', 'PAYOUT_CREATED', 'PAYOUT_COMPLETED', 'PAYOUT_FAILED', 'PAYOUT_RECEIPT_UPLOADED', 'CLIENT_ARCHIVE', 'CLIENT_RESTORE', 'SYSTEM_CONFIG_CHANGE', 'DATA_EXPORT', 'DATA_IMPORT');
ALTER TABLE "audit_logs" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "AuditAction_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "holdings" DROP CONSTRAINT "holdings_instrumentId_fkey";

-- DropForeignKey
ALTER TABLE "holdings" DROP CONSTRAINT "holdings_portfolioId_fkey";

-- DropForeignKey
ALTER TABLE "portfolios" DROP CONSTRAINT "portfolios_clientId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_requests" DROP CONSTRAINT "purchase_requests_clientId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_requests" DROP CONSTRAINT "purchase_requests_instrumentId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_requests" DROP CONSTRAINT "purchase_requests_processedById_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "fk_transaction_payout";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_instrumentId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_purchaseRequestId_fkey";

-- DropIndex
DROP INDEX "transactions_instrumentId_idx";

-- DropIndex
DROP INDEX "transactions_purchaseRequestId_key";

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "instrumentId",
DROP COLUMN "price",
DROP COLUMN "purchaseRequestId",
DROP COLUMN "quantity",
ALTER COLUMN "currency" SET DEFAULT 'AED';

-- DropTable
DROP TABLE "holdings";

-- DropTable
DROP TABLE "instruments";

-- DropTable
DROP TABLE "portfolios";

-- DropTable
DROP TABLE "purchase_requests";

-- DropEnum
DROP TYPE "InstrumentType";

-- RenameForeignKey
ALTER TABLE "payout_schedules" RENAME CONSTRAINT "fk_payout_schedule_client" TO "payout_schedules_clientId_fkey";

-- RenameForeignKey
ALTER TABLE "payout_schedules" RENAME CONSTRAINT "fk_payout_schedule_purchase_request" TO "payout_schedules_productPurchaseRequestId_fkey";

-- RenameForeignKey
ALTER TABLE "payouts" RENAME CONSTRAINT "fk_payout_client" TO "payouts_clientId_fkey";

-- RenameForeignKey
ALTER TABLE "payouts" RENAME CONSTRAINT "fk_payout_processor" TO "payouts_processedById_fkey";

-- RenameForeignKey
ALTER TABLE "payouts" RENAME CONSTRAINT "fk_payout_purchase_request" TO "payouts_productPurchaseRequestId_fkey";

-- RenameForeignKey
ALTER TABLE "payouts" RENAME CONSTRAINT "fk_payout_receipt" TO "payouts_receiptDocumentId_fkey";

-- RenameForeignKey
ALTER TABLE "payouts" RENAME CONSTRAINT "fk_payout_schedule" TO "payouts_payoutScheduleId_fkey";

-- RenameForeignKey
ALTER TABLE "payouts" RENAME CONSTRAINT "fk_payout_transaction" TO "payouts_transactionId_fkey";
