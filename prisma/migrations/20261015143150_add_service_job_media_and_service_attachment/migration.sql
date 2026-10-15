-- AlterTable
ALTER TABLE "job_opportunities" ADD COLUMN     "featuredImageAlt" TEXT,
ADD COLUMN     "featuredImageBytes" INTEGER,
ADD COLUMN     "featuredImageFormat" TEXT,
ADD COLUMN     "featuredImageHeight" INTEGER,
ADD COLUMN     "featuredImagePublicId" TEXT,
ADD COLUMN     "featuredImageUrl" TEXT,
ADD COLUMN     "featuredImageWidth" INTEGER;

-- AlterTable
ALTER TABLE "service_pages" ADD COLUMN     "attachmentDocumentId" TEXT,
ADD COLUMN     "featuredImageAlt" TEXT,
ADD COLUMN     "featuredImageBytes" INTEGER,
ADD COLUMN     "featuredImageFormat" TEXT,
ADD COLUMN     "featuredImageHeight" INTEGER,
ADD COLUMN     "featuredImagePublicId" TEXT,
ADD COLUMN     "featuredImageUrl" TEXT,
ADD COLUMN     "featuredImageWidth" INTEGER;

-- CreateIndex
CREATE INDEX "service_pages_attachmentDocumentId_idx" ON "service_pages"("attachmentDocumentId");

-- AddForeignKey
ALTER TABLE "service_pages" ADD CONSTRAINT "service_pages_attachmentDocumentId_fkey" FOREIGN KEY ("attachmentDocumentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
