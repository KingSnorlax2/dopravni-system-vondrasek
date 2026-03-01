/*
  Warnings:

  - You are about to drop the `_AutoTransakce` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_AutoTransakce" DROP CONSTRAINT "_AutoTransakce_A_fkey";

-- DropForeignKey
ALTER TABLE "_AutoTransakce" DROP CONSTRAINT "_AutoTransakce_B_fkey";

-- DropTable
DROP TABLE "_AutoTransakce";
