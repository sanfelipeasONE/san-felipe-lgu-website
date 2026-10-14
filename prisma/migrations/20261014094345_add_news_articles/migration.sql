-- CreateEnum
CREATE TYPE "NewsStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "news_articles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'news',
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "status" "NewsStatus" NOT NULL DEFAULT 'DRAFT',
    "officeId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "featuredImagePublicId" TEXT,
    "featuredImageUrl" TEXT,
    "featuredImageAlt" TEXT,
    "featuredImageWidth" INTEGER,
    "featuredImageHeight" INTEGER,
    "featuredImageFormat" TEXT,
    "featuredImageBytes" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "news_articles_slug_key" ON "news_articles"("slug");

-- CreateIndex
CREATE INDEX "news_articles_status_idx" ON "news_articles"("status");

-- CreateIndex
CREATE INDEX "news_articles_officeId_idx" ON "news_articles"("officeId");

-- CreateIndex
CREATE INDEX "news_articles_publishedAt_idx" ON "news_articles"("publishedAt");

-- CreateIndex
CREATE INDEX "news_articles_status_publishedAt_idx" ON "news_articles"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "news_articles_status_officeId_idx" ON "news_articles"("status", "officeId");

-- AddForeignKey
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
