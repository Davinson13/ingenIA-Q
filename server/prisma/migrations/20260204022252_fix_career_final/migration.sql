/*
  Warnings:

  - You are about to drop the column `careerId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_careerId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "careerId",
ADD COLUMN     "career" TEXT,
ADD COLUMN     "currentSemester" INTEGER;
