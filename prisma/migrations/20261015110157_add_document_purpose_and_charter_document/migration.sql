-- CreateEnum
CREATE TYPE "DocumentPurpose" AS ENUM ('DOWNLOADABLE_FORM', 'CITIZENS_CHARTER', 'JOB_ATTACHMENT', 'OTHER_PUBLIC_DOCUMENT');

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "purpose" "DocumentPurpose" NOT NULL DEFAULT 'DOWNLOADABLE_FORM';

-- AlterTable
ALTER TABLE "service_pages" ADD COLUMN     "charterDocumentId" TEXT;

-- CreateIndex
CREATE INDEX "documents_purpose_idx" ON "documents"("purpose");

-- CreateIndex
CREATE INDEX "documents_status_purpose_idx" ON "documents"("status", "purpose");

-- CreateIndex
CREATE INDEX "service_pages_charterDocumentId_idx" ON "service_pages"("charterDocumentId");

-- AddForeignKey
ALTER TABLE "service_pages" ADD CONSTRAINT "service_pages_charterDocumentId_fkey" FOREIGN KEY ("charterDocumentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
