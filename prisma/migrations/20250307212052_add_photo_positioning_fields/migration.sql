/*
  Warnings:

  - The primary key for the `Udrzba` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Auto" ADD COLUMN "thumbnailFotoId" TEXT;

-- AlterTable
ALTER TABLE "Fotka" ADD COLUMN "positionX" DOUBLE PRECISION,
ADD COLUMN "positionY" DOUBLE PRECISION,
ADD COLUMN "scale" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Udrzba" DROP CONSTRAINT "Udrzba_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "popis" DROP NOT NULL,
ALTER COLUMN "provedeno" DROP DEFAULT,
ADD CONSTRAINT "Udrzba_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Udrzba_id_seq";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'USER';
