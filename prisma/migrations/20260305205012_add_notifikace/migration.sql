-- CreateEnum
CREATE TYPE "NotifikaceTyp" AS ENUM ('STK_VAROVANI', 'RESET_HESLA', 'SCHVALENI', 'NOVY_UZIVATEL', 'SYSTEM');

-- CreateTable
CREATE TABLE "Notifikace" (
    "id" SERIAL NOT NULL,
    "uzivatelId" INTEGER NOT NULL,
    "typ" "NotifikaceTyp" NOT NULL,
    "titul" TEXT NOT NULL,
    "obsah" TEXT,
    "precteno" BOOLEAN NOT NULL DEFAULT false,
    "vytvoreno" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "odkaz" TEXT,

    CONSTRAINT "Notifikace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notifikace_uzivatelId_idx" ON "Notifikace"("uzivatelId");

-- CreateIndex
CREATE INDEX "Notifikace_precteno_uzivatelId_idx" ON "Notifikace"("precteno", "uzivatelId");

-- AddForeignKey
ALTER TABLE "Notifikace" ADD CONSTRAINT "Notifikace_uzivatelId_fkey" FOREIGN KEY ("uzivatelId") REFERENCES "Uzivatel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
