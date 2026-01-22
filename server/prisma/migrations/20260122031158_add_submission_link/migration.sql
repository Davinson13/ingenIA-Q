-- AlterTable
ALTER TABLE "ActivityGrade" ADD COLUMN     "submissionLink" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
