-- CreateEnum
CREATE TYPE "JobOpportunityStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "job_opportunities" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "itemNumber" TEXT,
    "officeId" TEXT NOT NULL,
    "employmentType" TEXT,
    "salaryGrade" TEXT,
    "monthlySalary" TEXT,
    "description" TEXT,
    "education" TEXT,
    "training" TEXT,
    "experience" TEXT,
    "eligibility" TEXT,
    "competency" TEXT,
    "applicationInstructions" TEXT,
    "postingDate" TIMESTAMP(3),
    "closingDate" TIMESTAMP(3),
    "status" "JobOpportunityStatus" NOT NULL DEFAULT 'DRAFT',
    "attachmentDocumentId" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_opportunities_slug_key" ON "job_opportunities"("slug");

-- CreateIndex
CREATE INDEX "job_opportunities_status_idx" ON "job_opportunities"("status");

-- CreateIndex
CREATE INDEX "job_opportunities_officeId_idx" ON "job_opportunities"("officeId");

-- CreateIndex
CREATE INDEX "job_opportunities_status_publishedAt_idx" ON "job_opportunities"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "job_opportunities_status_closingDate_idx" ON "job_opportunities"("status", "closingDate");

-- AddForeignKey
ALTER TABLE "job_opportunities" ADD CONSTRAINT "job_opportunities_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_opportunities" ADD CONSTRAINT "job_opportunities_attachmentDocumentId_fkey" FOREIGN KEY ("attachmentDocumentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_opportunities" ADD CONSTRAINT "job_opportunities_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_opportunities" ADD CONSTRAINT "job_opportunities_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
