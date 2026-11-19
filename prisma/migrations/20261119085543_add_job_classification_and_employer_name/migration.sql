-- CreateEnum
CREATE TYPE "EmploymentClassification" AS ENUM ('GOVERNMENT', 'PRIVATE');

-- AlterTable
ALTER TABLE "job_opportunities" ADD COLUMN     "employerName" TEXT,
ADD COLUMN     "employmentClassification" "EmploymentClassification";
