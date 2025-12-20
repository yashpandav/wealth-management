-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'RM', 'ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'RM_REVIEW', 'RM_APPROVED', 'RM_REJECTED', 'ADMIN_REVIEW', 'ADMIN_APPROVED', 'ADMIN_REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PURCHASE', 'WITHDRAWAL', 'DIVIDEND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('COMPLETED', 'FAILED', 'REVERSED', 'PENDING_SETTLEMENT');

-- CreateEnum
CREATE TYPE "InstrumentType" AS ENUM ('STOCK', 'BOND', 'MUTUAL_FUND', 'ETF', 'COMMODITY', 'CRYPTOCURRENCY', 'REAL_ESTATE', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'MFA_ENABLE', 'MFA_DISABLE', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_ACTIVATE', 'USER_DEACTIVATE', 'CLIENT_ASSIGN', 'CLIENT_REASSIGN', 'PURCHASE_REQUEST_CREATE', 'PURCHASE_REQUEST_APPROVE', 'PURCHASE_REQUEST_REJECT', 'PURCHASE_REQUEST_CANCEL', 'WITHDRAWAL_REQUEST_CREATE', 'WITHDRAWAL_REQUEST_RM_APPROVE', 'WITHDRAWAL_REQUEST_RM_REJECT', 'WITHDRAWAL_REQUEST_ADMIN_APPROVE', 'WITHDRAWAL_REQUEST_ADMIN_REJECT', 'WITHDRAWAL_REQUEST_CANCEL', 'TRANSACTION_CREATE', 'TRANSACTION_REVERSE', 'TRANSACTION_FAIL', 'INSTRUMENT_CREATE', 'INSTRUMENT_UPDATE', 'INSTRUMENT_DELETE', 'INSTRUMENT_ACTIVATE', 'INSTRUMENT_DEACTIVATE', 'PORTFOLIO_CREATE', 'PORTFOLIO_UPDATE', 'HOLDING_CREATE', 'HOLDING_UPDATE', 'HOLDING_DELETE', 'SYSTEM_CONFIG_CHANGE', 'DATA_EXPORT', 'DATA_IMPORT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'ALERT');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('TRANSACTION', 'REQUEST', 'ASSIGNMENT', 'SYSTEM', 'PORTFOLIO', 'SECURITY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lockoutCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedRMId" TEXT NOT NULL,
    "riskTolerance" TEXT,
    "investmentGoals" TEXT,
    "kycVerified" BOOLEAN NOT NULL DEFAULT false,
    "kycDocuments" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relationship_managers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specialization" TEXT,
    "certifications" TEXT,
    "maxClientLimit" INTEGER DEFAULT 50,
    "totalAUM" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "relationship_managers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolios" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "totalValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalInvested" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalGainLoss" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalGainLossPercent" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "dayChange" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "dayChangePercent" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "weekChange" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "monthChange" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "yearChange" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instruments" (
    "id" TEXT NOT NULL,
    "symbol" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "InstrumentType" NOT NULL,
    "isin" VARCHAR(12),
    "description" TEXT,
    "currentPrice" DECIMAL(15,4) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "lastPriceUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exchange" VARCHAR(50),
    "sector" VARCHAR(100),
    "marketCap" DECIMAL(20,2),
    "yearlyHigh" DECIMAL(15,4),
    "yearlyLow" DECIMAL(15,4),
    "dividendYield" DECIMAL(5,4),
    "peRatio" DECIMAL(10,2),
    "riskRating" VARCHAR(20),
    "minimumInvestment" DECIMAL(15,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "launchDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "instruments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holdings" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "quantity" DECIMAL(15,6) NOT NULL,
    "averagePurchasePrice" DECIMAL(15,4) NOT NULL,
    "totalCost" DECIMAL(15,2) NOT NULL,
    "currentPrice" DECIMAL(15,4) NOT NULL,
    "currentValue" DECIMAL(15,2) NOT NULL,
    "gainLoss" DECIMAL(15,2) NOT NULL,
    "gainLossPercent" DECIMAL(10,4) NOT NULL,
    "dayChange" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "dayChangePercent" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "allocationPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "firstPurchasedAt" TIMESTAMP(3) NOT NULL,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_requests" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "instrumentSymbol" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "quantity" DECIMAL(15,4),
    "requestedPrice" DECIMAL(15,4),
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "processedById" TEXT,
    "processedAt" TIMESTAMP(3),
    "bankStatementRef" TEXT,
    "paymentProof" TEXT,
    "clientNotes" TEXT,
    "rmNotes" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawal_requests" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "bankAccountName" TEXT NOT NULL,
    "bankAccountNumber" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankBranch" TEXT,
    "swiftCode" TEXT,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "processedByRMId" TEXT,
    "rmProcessedAt" TIMESTAMP(3),
    "rmApproved" BOOLEAN,
    "rmNotes" TEXT,
    "approvedByAdminId" TEXT,
    "adminProcessedAt" TIMESTAMP(3),
    "adminApproved" BOOLEAN,
    "adminNotes" TEXT,
    "bankStatementRef" TEXT,
    "reason" TEXT,
    "clientNotes" TEXT,
    "rejectionReason" TEXT,
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "instrumentId" TEXT,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "amount" DECIMAL(15,2) NOT NULL,
    "price" DECIMAL(15,4),
    "quantity" DECIMAL(15,6),
    "total" DECIMAL(15,2) NOT NULL,
    "fees" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "bankStatementReference" TEXT,
    "paymentProof" TEXT,
    "processedById" TEXT,
    "approvedById" TEXT,
    "purchaseRequestId" TEXT,
    "withdrawalRequestId" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" TEXT,
    "failureReason" TEXT,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "description" TEXT,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" VARCHAR(45) NOT NULL,
    "userAgent" TEXT,
    "metadata" JSONB,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'INFO',
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "sessionId" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retentionDate" TIMESTAMP(3),

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" VARCHAR(500),
    "actionText" VARCHAR(100),
    "entityType" VARCHAR(50),
    "entityId" TEXT,
    "priority" VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "clients_userId_key" ON "clients"("userId");

-- CreateIndex
CREATE INDEX "clients_assignedRMId_idx" ON "clients"("assignedRMId");

-- CreateIndex
CREATE UNIQUE INDEX "relationship_managers_userId_key" ON "relationship_managers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "portfolios_clientId_key" ON "portfolios"("clientId");

-- CreateIndex
CREATE INDEX "portfolios_clientId_idx" ON "portfolios"("clientId");

-- CreateIndex
CREATE INDEX "portfolios_totalValue_idx" ON "portfolios"("totalValue");

-- CreateIndex
CREATE INDEX "portfolios_lastUpdatedAt_idx" ON "portfolios"("lastUpdatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "instruments_symbol_key" ON "instruments"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "instruments_isin_key" ON "instruments"("isin");

-- CreateIndex
CREATE INDEX "instruments_symbol_idx" ON "instruments"("symbol");

-- CreateIndex
CREATE INDEX "instruments_type_idx" ON "instruments"("type");

-- CreateIndex
CREATE INDEX "instruments_isActive_idx" ON "instruments"("isActive");

-- CreateIndex
CREATE INDEX "instruments_isPublic_idx" ON "instruments"("isPublic");

-- CreateIndex
CREATE INDEX "holdings_portfolioId_idx" ON "holdings"("portfolioId");

-- CreateIndex
CREATE INDEX "holdings_instrumentId_idx" ON "holdings"("instrumentId");

-- CreateIndex
CREATE INDEX "holdings_currentValue_idx" ON "holdings"("currentValue");

-- CreateIndex
CREATE UNIQUE INDEX "holdings_portfolioId_instrumentId_key" ON "holdings"("portfolioId", "instrumentId");

-- CreateIndex
CREATE INDEX "purchase_requests_clientId_idx" ON "purchase_requests"("clientId");

-- CreateIndex
CREATE INDEX "purchase_requests_status_idx" ON "purchase_requests"("status");

-- CreateIndex
CREATE INDEX "purchase_requests_createdAt_idx" ON "purchase_requests"("createdAt");

-- CreateIndex
CREATE INDEX "purchase_requests_processedById_idx" ON "purchase_requests"("processedById");

-- CreateIndex
CREATE INDEX "withdrawal_requests_clientId_idx" ON "withdrawal_requests"("clientId");

-- CreateIndex
CREATE INDEX "withdrawal_requests_status_idx" ON "withdrawal_requests"("status");

-- CreateIndex
CREATE INDEX "withdrawal_requests_createdAt_idx" ON "withdrawal_requests"("createdAt");

-- CreateIndex
CREATE INDEX "withdrawal_requests_processedByRMId_idx" ON "withdrawal_requests"("processedByRMId");

-- CreateIndex
CREATE INDEX "withdrawal_requests_approvedByAdminId_idx" ON "withdrawal_requests"("approvedByAdminId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_purchaseRequestId_key" ON "transactions"("purchaseRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_withdrawalRequestId_key" ON "transactions"("withdrawalRequestId");

-- CreateIndex
CREATE INDEX "transactions_clientId_idx" ON "transactions"("clientId");

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "transactions"("type");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_completedAt_idx" ON "transactions"("completedAt");

-- CreateIndex
CREATE INDEX "transactions_instrumentId_idx" ON "transactions"("instrumentId");

-- CreateIndex
CREATE INDEX "transactions_processedById_idx" ON "transactions"("processedById");

-- CreateIndex
CREATE INDEX "transactions_createdAt_idx" ON "transactions"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_severity_idx" ON "audit_logs"("severity");

-- CreateIndex
CREATE INDEX "audit_logs_ipAddress_idx" ON "audit_logs"("ipAddress");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_category_idx" ON "notifications"("category");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_expiresAt_idx" ON "notifications"("expiresAt");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_assignedRMId_fkey" FOREIGN KEY ("assignedRMId") REFERENCES "relationship_managers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationship_managers" ADD CONSTRAINT "relationship_managers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "instruments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "relationship_managers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_processedByRMId_fkey" FOREIGN KEY ("processedByRMId") REFERENCES "relationship_managers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_approvedByAdminId_fkey" FOREIGN KEY ("approvedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "instruments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "relationship_managers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "purchase_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_withdrawalRequestId_fkey" FOREIGN KEY ("withdrawalRequestId") REFERENCES "withdrawal_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
