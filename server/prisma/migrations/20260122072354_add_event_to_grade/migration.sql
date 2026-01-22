/*
  Warnings:

  - A unique constraint covering the columns `[studentId,eventId]` on the table `ActivityGrade` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "ActivityGrade" DROP CONSTRAINT "ActivityGrade_activityId_fkey";

-- AlterTable
ALTER TABLE "ActivityGrade" ADD COLUMN     "eventId" INTEGER,
ALTER COLUMN "activityId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ActivityGrade_studentId_eventId_key" ON "ActivityGrade"("studentId", "eventId");

-- AddForeignKey
ALTER TABLE "ActivityGrade" ADD CONSTRAINT "ActivityGrade_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityGrade" ADD CONSTRAINT "ActivityGrade_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
