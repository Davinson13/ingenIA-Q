-- CreateTable
CREATE TABLE "Tutoring" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "notes" TEXT,
    "teacherId" INTEGER NOT NULL,
    "subjectId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tutoring_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutoringBooking" (
    "id" SERIAL NOT NULL,
    "tutoringId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TutoringBooking_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Tutoring" ADD CONSTRAINT "Tutoring_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tutoring" ADD CONSTRAINT "Tutoring_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringBooking" ADD CONSTRAINT "TutoringBooking_tutoringId_fkey" FOREIGN KEY ("tutoringId") REFERENCES "Tutoring"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringBooking" ADD CONSTRAINT "TutoringBooking_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
