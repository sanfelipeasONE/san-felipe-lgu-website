-- CreateEnum
CREATE TYPE "TourismCategory" AS ENUM ('ATTRACTIONS', 'RESORTS', 'CULTURE_AND_ARTS', 'PRODUCTS');

-- CreateEnum
CREATE TYPE "TourismStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "tourism_entries" (
    "id" TEXT NOT NULL,
    "category" "TourismCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "location" TEXT,
    "mapUrl" TEXT,
    "contactNumber" TEXT,
    "email" TEXT,
    "websiteUrl" TEXT,
    "operatingHours" TEXT,
    "status" "TourismStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "featuredImagePublicId" TEXT,
    "featuredImageUrl" TEXT,
    "featuredImageAlt" TEXT,
    "featuredImageWidth" INTEGER,
    "featuredImageHeight" INTEGER,
    "featuredImageFormat" TEXT,
    "featuredImageBytes" INTEGER,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tourism_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tourism_entries_slug_key" ON "tourism_entries"("slug");

-- CreateIndex
CREATE INDEX "tourism_entries_category_idx" ON "tourism_entries"("category");

-- CreateIndex
CREATE INDEX "tourism_entries_status_idx" ON "tourism_entries"("status");

-- CreateIndex
CREATE INDEX "tourism_entries_status_category_idx" ON "tourism_entries"("status", "category");

-- CreateIndex
CREATE INDEX "tourism_entries_status_publishedAt_idx" ON "tourism_entries"("status", "publishedAt");

-- AddForeignKey
ALTER TABLE "tourism_entries" ADD CONSTRAINT "tourism_entries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tourism_entries" ADD CONSTRAINT "tourism_entries_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
