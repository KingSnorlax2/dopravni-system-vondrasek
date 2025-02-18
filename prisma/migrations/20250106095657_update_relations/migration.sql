/*
  Warnings:

  - You are about to alter the column `castka` on the `Transakce` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - Added the required column `popis` to the `Transakce` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Transakce" DROP CONSTRAINT "Transakce_autoId_fkey";

-- AlterTable
ALTER TABLE "Transakce" ADD COLUMN "popis" TEXT NOT NULL;
ALTER TABLE "Transakce" ALTER COLUMN "autoId" DROP NOT NULL;
ALTER TABLE "Transakce" ALTER COLUMN "castka" TYPE INTEGER;

-- AddForeignKey
ALTER TABLE "Transakce" ADD CONSTRAINT "Transakce_autoId_fkey" FOREIGN KEY ("autoId") REFERENCES "Auto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
