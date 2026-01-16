/*
  Warnings:

  - You are about to drop the `product_options` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_purchase_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "product_options" DROP CONSTRAINT "product_options_productId_fkey";

-- DropForeignKey
ALTER TABLE "product_purchase_requests" DROP CONSTRAINT "product_purchase_requests_assignedRMId_fkey";

-- DropForeignKey
ALTER TABLE "product_purchase_requests" DROP CONSTRAINT "product_purchase_requests_clientId_fkey";

-- DropForeignKey
ALTER TABLE "product_purchase_requests" DROP CONSTRAINT "product_purchase_requests_completedById_fkey";

-- DropForeignKey
ALTER TABLE "product_purchase_requests" DROP CONSTRAINT "product_purchase_requests_contractDocumentId_fkey";

-- DropForeignKey
ALTER TABLE "product_purchase_requests" DROP CONSTRAINT "product_purchase_requests_productId_fkey";

-- DropForeignKey
ALTER TABLE "product_purchase_requests" DROP CONSTRAINT "product_purchase_requests_productOptionId_fkey";

-- DropTable
DROP TABLE "product_options";

-- DropTable
DROP TABLE "product_purchase_requests";

-- DropTable
DROP TABLE "products";

-- CreateTable
CREATE TABLE "investments" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "minAmount" DECIMAL(15,2) NOT NULL,
    "maxAmount" DECIMAL(15,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'AED',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_options" (
    "id" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "duration" VARCHAR(50) NOT NULL,
    "withdrawalFrequency" VARCHAR(50) NOT NULL,
    "roi" DECIMAL(5,2) NOT NULL,
    "annualReturn" DECIMAL(5,2) NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_purchase_requests" (
    "id" TEXT NOT NULL,
    "trackingNumber" VARCHAR(50) NOT NULL,
    "clientId" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "investmentOptionId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "assignedRMId" TEXT,
    "processedAt" TIMESTAMP(3),
    "contractDocumentId" TEXT,
    "contractStartDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "clientNotes" TEXT,
    "rmNotes" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_purchase_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "investments_isActive_idx" ON "investments"("isActive");

-- CreateIndex
CREATE INDEX "investments_displayOrder_idx" ON "investments"("displayOrder");

-- CreateIndex
CREATE INDEX "investment_options_investmentId_idx" ON "investment_options"("investmentId");

-- CreateIndex
CREATE INDEX "investment_options_isActive_idx" ON "investment_options"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "investment_purchase_requests_trackingNumber_key" ON "investment_purchase_requests"("trackingNumber");

-- CreateIndex
CREATE INDEX "investment_purchase_requests_clientId_idx" ON "investment_purchase_requests"("clientId");

-- CreateIndex
CREATE INDEX "investment_purchase_requests_investmentId_idx" ON "investment_purchase_requests"("investmentId");

-- CreateIndex
CREATE INDEX "investment_purchase_requests_investmentOptionId_idx" ON "investment_purchase_requests"("investmentOptionId");

-- CreateIndex
CREATE INDEX "investment_purchase_requests_assignedRMId_idx" ON "investment_purchase_requests"("assignedRMId");

-- CreateIndex
CREATE INDEX "investment_purchase_requests_status_idx" ON "investment_purchase_requests"("status");

-- CreateIndex
CREATE INDEX "investment_purchase_requests_createdAt_idx" ON "investment_purchase_requests"("createdAt");

-- CreateIndex
CREATE INDEX "investment_purchase_requests_contractDocumentId_idx" ON "investment_purchase_requests"("contractDocumentId");

-- AddForeignKey
ALTER TABLE "investment_options" ADD CONSTRAINT "investment_options_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "investments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_purchase_requests" ADD CONSTRAINT "investment_purchase_requests_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_purchase_requests" ADD CONSTRAINT "investment_purchase_requests_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "investments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_purchase_requests" ADD CONSTRAINT "investment_purchase_requests_investmentOptionId_fkey" FOREIGN KEY ("investmentOptionId") REFERENCES "investment_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_purchase_requests" ADD CONSTRAINT "investment_purchase_requests_assignedRMId_fkey" FOREIGN KEY ("assignedRMId") REFERENCES "relationship_managers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_purchase_requests" ADD CONSTRAINT "investment_purchase_requests_contractDocumentId_fkey" FOREIGN KEY ("contractDocumentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_purchase_requests" ADD CONSTRAINT "investment_purchase_requests_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
