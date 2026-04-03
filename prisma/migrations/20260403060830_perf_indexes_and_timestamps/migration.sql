/*
  Warnings:

  - Added the required column `updatedAt` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `relationship_managers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "relationship_managers" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "audit_logs_userId_action_idx" ON "audit_logs"("userId", "action");

-- CreateIndex
CREATE INDEX "clients_assignedRMId_verificationStatus_idx" ON "clients"("assignedRMId", "verificationStatus");

-- CreateIndex
CREATE INDEX "documents_clientId_verificationStatus_idx" ON "documents"("clientId", "verificationStatus");

-- CreateIndex
CREATE INDEX "investment_purchase_requests_assignedRMId_status_idx" ON "investment_purchase_requests"("assignedRMId", "status");

-- CreateIndex
CREATE INDEX "investment_purchase_requests_clientId_status_idx" ON "investment_purchase_requests"("clientId", "status");

-- CreateIndex
CREATE INDEX "payout_schedules_scheduledDate_isProcessed_idx" ON "payout_schedules"("scheduledDate", "isProcessed");

-- CreateIndex
CREATE INDEX "payouts_clientId_scheduledDate_idx" ON "payouts"("clientId", "scheduledDate");

-- CreateIndex
CREATE INDEX "payouts_clientId_status_idx" ON "payouts"("clientId", "status");

-- CreateIndex
CREATE INDEX "transactions_clientId_type_status_idx" ON "transactions"("clientId", "type", "status");
