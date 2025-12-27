/*
  Warnings:

  - You are about to drop the column `instrumentSymbol` on the `purchase_requests` table. All the data in the column will be lost.
  - You are about to drop the column `lastLoginAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lockedUntil` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lockoutCount` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[trackingNumber]` on the table `purchase_requests` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[trackingNumber]` on the table `withdrawal_requests` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `trackingNumber` to the `purchase_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trackingNumber` to the `withdrawal_requests` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('IDENTITY_PROOF', 'ADDRESS_PROOF', 'INCOME_PROOF', 'BANK_STATEMENT', 'TAX_DOCUMENT', 'INVESTMENT_AGREEMENT', 'KYC_FORM', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('INSTAGRAM', 'YOUTUBE', 'FACEBOOK_ADS', 'GOOGLE_ADS', 'WEBSITE', 'REFERRAL', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'INTERESTED', 'NOT_INTERESTED', 'CONVERTED', 'LOST');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'DOCUMENT_UPLOAD';
ALTER TYPE "AuditAction" ADD VALUE 'DOCUMENT_VERIFY';
ALTER TYPE "AuditAction" ADD VALUE 'DOCUMENT_REJECT';
ALTER TYPE "AuditAction" ADD VALUE 'DOCUMENT_DELETE';
ALTER TYPE "AuditAction" ADD VALUE 'CLIENT_VERIFICATION_STATUS_UPDATE';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'DOCADMIN';

-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_assignedRMId_fkey";

-- AlterTable
ALTER TABLE "audit_logs" ALTER COLUMN "ipAddress" DROP NOT NULL;

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
ALTER COLUMN "assignedRMId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "instruments" ADD COLUMN     "prospectusUrl" VARCHAR(500);

-- AlterTable
ALTER TABLE "purchase_requests" DROP COLUMN "instrumentSymbol",
ADD COLUMN     "trackingNumber" VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "lastLoginAt",
DROP COLUMN "lockedUntil",
DROP COLUMN "lockoutCount",
ADD COLUMN     "accountLockedUntil" TIMESTAMP(3),
ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastFailedLogin" TIMESTAMP(3),
ADD COLUMN     "lastLogin" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "withdrawal_requests" ADD COLUMN     "trackingNumber" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'EMAIL_VERIFICATION',
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "filePath" VARCHAR(500) NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "fileName" VARCHAR(255),
    "fileSize" INTEGER,
    "mimeType" VARCHAR(100),
    "description" TEXT,
    "expiryDate" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_leads" (
    "id" TEXT NOT NULL,
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phoneNumber" VARCHAR(50) NOT NULL,
    "leadSource" "LeadSource" NOT NULL,
    "rmReference" VARCHAR(255),
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "assignedRMId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
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

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_options" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "duration" VARCHAR(50) NOT NULL,
    "withdrawalFrequency" VARCHAR(50) NOT NULL,
    "roi" DECIMAL(5,2) NOT NULL,
    "annualReturn" DECIMAL(5,2) NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_purchase_requests" (
    "id" TEXT NOT NULL,
    "trackingNumber" VARCHAR(50) NOT NULL,
    "clientId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productOptionId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "assignedRMId" TEXT,
    "processedAt" TIMESTAMP(3),
    "clientNotes" TEXT,
    "rmNotes" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_purchase_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE INDEX "verification_tokens_email_idx" ON "verification_tokens"("email");

-- CreateIndex
CREATE INDEX "verification_tokens_token_idx" ON "verification_tokens"("token");

-- CreateIndex
CREATE INDEX "verification_tokens_expiresAt_idx" ON "verification_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "verification_tokens_type_idx" ON "verification_tokens"("type");

-- CreateIndex
CREATE INDEX "documents_clientId_idx" ON "documents"("clientId");

-- CreateIndex
CREATE INDEX "documents_documentType_idx" ON "documents"("documentType");

-- CreateIndex
CREATE INDEX "documents_verificationStatus_idx" ON "documents"("verificationStatus");

-- CreateIndex
CREATE INDEX "documents_verifiedById_idx" ON "documents"("verifiedById");

-- CreateIndex
CREATE INDEX "documents_uploadedAt_idx" ON "documents"("uploadedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_leads_email_key" ON "user_leads"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_leads_userId_key" ON "user_leads"("userId");

-- CreateIndex
CREATE INDEX "user_leads_email_idx" ON "user_leads"("email");

-- CreateIndex
CREATE INDEX "user_leads_leadSource_idx" ON "user_leads"("leadSource");

-- CreateIndex
CREATE INDEX "user_leads_status_idx" ON "user_leads"("status");

-- CreateIndex
CREATE INDEX "user_leads_assignedRMId_idx" ON "user_leads"("assignedRMId");

-- CreateIndex
CREATE INDEX "user_leads_createdAt_idx" ON "user_leads"("createdAt");

-- CreateIndex
CREATE INDEX "products_isActive_idx" ON "products"("isActive");

-- CreateIndex
CREATE INDEX "products_displayOrder_idx" ON "products"("displayOrder");

-- CreateIndex
CREATE INDEX "product_options_productId_idx" ON "product_options"("productId");

-- CreateIndex
CREATE INDEX "product_options_isActive_idx" ON "product_options"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "product_purchase_requests_trackingNumber_key" ON "product_purchase_requests"("trackingNumber");

-- CreateIndex
CREATE INDEX "product_purchase_requests_clientId_idx" ON "product_purchase_requests"("clientId");

-- CreateIndex
CREATE INDEX "product_purchase_requests_productId_idx" ON "product_purchase_requests"("productId");

-- CreateIndex
CREATE INDEX "product_purchase_requests_productOptionId_idx" ON "product_purchase_requests"("productOptionId");

-- CreateIndex
CREATE INDEX "product_purchase_requests_assignedRMId_idx" ON "product_purchase_requests"("assignedRMId");

-- CreateIndex
CREATE INDEX "product_purchase_requests_status_idx" ON "product_purchase_requests"("status");

-- CreateIndex
CREATE INDEX "product_purchase_requests_createdAt_idx" ON "product_purchase_requests"("createdAt");

-- CreateIndex
CREATE INDEX "clients_verificationStatus_idx" ON "clients"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_requests_trackingNumber_key" ON "purchase_requests"("trackingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawal_requests_trackingNumber_key" ON "withdrawal_requests"("trackingNumber");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_assignedRMId_fkey" FOREIGN KEY ("assignedRMId") REFERENCES "relationship_managers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "instruments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_leads" ADD CONSTRAINT "user_leads_assignedRMId_fkey" FOREIGN KEY ("assignedRMId") REFERENCES "relationship_managers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_leads" ADD CONSTRAINT "user_leads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_purchase_requests" ADD CONSTRAINT "product_purchase_requests_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_purchase_requests" ADD CONSTRAINT "product_purchase_requests_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_purchase_requests" ADD CONSTRAINT "product_purchase_requests_productOptionId_fkey" FOREIGN KEY ("productOptionId") REFERENCES "product_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_purchase_requests" ADD CONSTRAINT "product_purchase_requests_assignedRMId_fkey" FOREIGN KEY ("assignedRMId") REFERENCES "relationship_managers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
