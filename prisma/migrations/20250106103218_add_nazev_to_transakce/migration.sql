/*
  Warnings:

  - Added the required column `nazev` to the `Transakce` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transakce" ADD COLUMN     "nazev" TEXT NOT NULL,
ALTER COLUMN "castka" SET DATA TYPE DOUBLE PRECISION;
