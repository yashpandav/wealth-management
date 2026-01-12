/*
  Warnings:

  - The values [ADDRESS_PROOF,INCOME_PROOF,BANK_STATEMENT,TAX_DOCUMENT,KYC_FORM] on the enum `DocumentType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DocumentType_new" AS ENUM ('IDENTITY_PROOF', 'INVESTMENT_AGREEMENT', 'OTHER');
ALTER TABLE "documents" ALTER COLUMN "documentType" TYPE "DocumentType_new" USING ("documentType"::text::"DocumentType_new");
ALTER TYPE "DocumentType" RENAME TO "DocumentType_old";
ALTER TYPE "DocumentType_new" RENAME TO "DocumentType";
DROP TYPE "DocumentType_old";
COMMIT;

-- CreateIndex
CREATE INDEX "documents_clientId_documentType_idx" ON "documents"("clientId", "documentType");
