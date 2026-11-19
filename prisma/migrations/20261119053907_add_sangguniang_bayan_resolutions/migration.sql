-- CreateEnum
CREATE TYPE "ResolutionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "sangguniang_bayan_resolutions" (
    "id" TEXT NOT NULL,
    "resolutionNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "adoptedAt" TIMESTAMP(3) NOT NULL,
    "summary" TEXT,
    "status" "ResolutionStatus" NOT NULL DEFAULT 'DRAFT',
    "officeId" TEXT NOT NULL,
    "originalFilename" TEXT,
    "storagePublicId" TEXT,
    "storageUrl" TEXT,
    "resourceType" TEXT NOT NULL DEFAULT 'raw',
    "format" TEXT,
    "mimeType" TEXT,
    "bytes" INTEGER,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sangguniang_bayan_resolutions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sangguniang_bayan_resolutions_status_idx" ON "sangguniang_bayan_resolutions"("status");

-- CreateIndex
CREATE INDEX "sangguniang_bayan_resolutions_year_idx" ON "sangguniang_bayan_resolutions"("year");

-- CreateIndex
CREATE INDEX "sangguniang_bayan_resolutions_status_year_idx" ON "sangguniang_bayan_resolutions"("status", "year");

-- CreateIndex
CREATE INDEX "sangguniang_bayan_resolutions_status_adoptedAt_idx" ON "sangguniang_bayan_resolutions"("status", "adoptedAt");

-- CreateIndex
CREATE INDEX "sangguniang_bayan_resolutions_officeId_idx" ON "sangguniang_bayan_resolutions"("officeId");

-- CreateIndex
CREATE UNIQUE INDEX "sangguniang_bayan_resolutions_resolutionNumber_year_key" ON "sangguniang_bayan_resolutions"("resolutionNumber", "year");

-- AddForeignKey
ALTER TABLE "sangguniang_bayan_resolutions" ADD CONSTRAINT "sangguniang_bayan_resolutions_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sangguniang_bayan_resolutions" ADD CONSTRAINT "sangguniang_bayan_resolutions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sangguniang_bayan_resolutions" ADD CONSTRAINT "sangguniang_bayan_resolutions_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
