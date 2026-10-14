-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "service_pages" (
    "id" TEXT NOT NULL,
    "serviceKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ServiceStatus" NOT NULL DEFAULT 'DRAFT',
    "officeId" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_sections" (
    "id" TEXT NOT NULL,
    "servicePageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_pages_serviceKey_key" ON "service_pages"("serviceKey");

-- CreateIndex
CREATE INDEX "service_pages_status_idx" ON "service_pages"("status");

-- CreateIndex
CREATE INDEX "service_pages_officeId_idx" ON "service_pages"("officeId");

-- CreateIndex
CREATE INDEX "service_pages_serviceKey_idx" ON "service_pages"("serviceKey");

-- CreateIndex
CREATE INDEX "service_sections_servicePageId_idx" ON "service_sections"("servicePageId");

-- CreateIndex
CREATE INDEX "service_sections_servicePageId_sortOrder_idx" ON "service_sections"("servicePageId", "sortOrder");

-- AddForeignKey
ALTER TABLE "service_pages" ADD CONSTRAINT "service_pages_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "offices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_pages" ADD CONSTRAINT "service_pages_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_pages" ADD CONSTRAINT "service_pages_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_sections" ADD CONSTRAINT "service_sections_servicePageId_fkey" FOREIGN KEY ("servicePageId") REFERENCES "service_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
