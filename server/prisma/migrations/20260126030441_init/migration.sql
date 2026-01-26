-- AlterTable
ALTER TABLE "Tutoring" ADD COLUMN     "modality" TEXT NOT NULL DEFAULT 'PRESENCIAL';

-- CreateTable
CREATE TABLE "PersonalEvent" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalCourse" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "days" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "studentId" INTEGER NOT NULL,

    CONSTRAINT "ExternalCourse_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PersonalEvent" ADD CONSTRAINT "PersonalEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalCourse" ADD CONSTRAINT "ExternalCourse_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
