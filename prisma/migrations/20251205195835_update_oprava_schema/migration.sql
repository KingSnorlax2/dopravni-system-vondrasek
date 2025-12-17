/*
  Warnings:

  - You are about to drop the column `datumOpravy` on the `Oprava` table. All the data in the column will be lost.
  - You are about to drop the column `servis` on the `Oprava` table. All the data in the column will be lost.
  - You are about to drop the column `stav` on the `Oprava` table. All the data in the column will be lost.
  - You are about to drop the column `typOpravy` on the `Oprava` table. All the data in the column will be lost.
  - Added the required column `datum` to the `Oprava` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kategorie` to the `Oprava` table without a default value. This is not possible if the table is not empty.
  - Added the required column `najezd` to the `Oprava` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Oprava" DROP COLUMN "datumOpravy",
DROP COLUMN "servis",
DROP COLUMN "stav",
DROP COLUMN "typOpravy",
ADD COLUMN     "datum" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "kategorie" TEXT NOT NULL,
ADD COLUMN     "najezd" INTEGER NOT NULL,
ALTER COLUMN "cena" DROP NOT NULL;
