/*
  Warnings:

  - A unique constraint covering the columns `[thumbnailFotoId]` on the table `Auto` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UzivatelRole" AS ENUM ('ADMIN', 'DISPECER', 'RIDIC', 'DRIVER');

-- CreateTable
CREATE TABLE "Uzivatel" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "heslo" TEXT NOT NULL,
    "jmeno" TEXT,
    "role" "UzivatelRole" NOT NULL DEFAULT 'RIDIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Uzivatel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Uzivatel_email_key" ON "Uzivatel"("email");

-- CreateIndex
CREATE INDEX "Uzivatel_email_idx" ON "Uzivatel"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Auto_thumbnailFotoId_key" ON "Auto"("thumbnailFotoId");

-- AddForeignKey
ALTER TABLE "Auto" ADD CONSTRAINT "Auto_thumbnailFotoId_fkey" FOREIGN KEY ("thumbnailFotoId") REFERENCES "Fotka"("id") ON DELETE SET NULL ON UPDATE CASCADE;
