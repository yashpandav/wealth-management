-- AlterTable
ALTER TABLE "product_purchase_requests" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "completedById" TEXT,
ADD COLUMN     "contractDocumentId" TEXT,
ADD COLUMN     "contractStartDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "product_purchase_requests_contractDocumentId_idx" ON "product_purchase_requests"("contractDocumentId");

-- AddForeignKey
ALTER TABLE "product_purchase_requests" ADD CONSTRAINT "product_purchase_requests_contractDocumentId_fkey" FOREIGN KEY ("contractDocumentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_purchase_requests" ADD CONSTRAINT "product_purchase_requests_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
