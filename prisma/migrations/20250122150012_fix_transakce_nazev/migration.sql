-- AlterTable
ALTER TABLE "Auto" ADD COLUMN     "aktivni" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "GPSZaznam" (
    "id" SERIAL NOT NULL,
    "autoId" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "rychlost" DOUBLE PRECISION,
    "cas" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stav" TEXT,

    CONSTRAINT "GPSZaznam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Udrzba" (
    "id" SERIAL NOT NULL,
    "autoId" INTEGER NOT NULL,
    "typ" TEXT NOT NULL,
    "popis" TEXT NOT NULL,
    "datumProvedeni" TIMESTAMP(3) NOT NULL,
    "datumPristi" TIMESTAMP(3),
    "najezdKm" INTEGER NOT NULL,
    "nakladyCelkem" DOUBLE PRECISION NOT NULL,
    "provedeno" BOOLEAN NOT NULL DEFAULT false,
    "dokumenty" TEXT,
    "poznamka" TEXT,

    CONSTRAINT "Udrzba_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tankovani" (
    "id" SERIAL NOT NULL,
    "autoId" INTEGER NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL,
    "mnozstviLitru" DOUBLE PRECISION NOT NULL,
    "cenaZaLitr" DOUBLE PRECISION NOT NULL,
    "celkovaCena" DOUBLE PRECISION NOT NULL,
    "typPaliva" TEXT NOT NULL,
    "najezdKm" INTEGER NOT NULL,
    "mistoTankovani" TEXT,
    "plnaNadrz" BOOLEAN NOT NULL DEFAULT true,
    "poznamka" TEXT,

    CONSTRAINT "Tankovani_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GPSZaznam" ADD CONSTRAINT "GPSZaznam_autoId_fkey" FOREIGN KEY ("autoId") REFERENCES "Auto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Udrzba" ADD CONSTRAINT "Udrzba_autoId_fkey" FOREIGN KEY ("autoId") REFERENCES "Auto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tankovani" ADD CONSTRAINT "Tankovani_autoId_fkey" FOREIGN KEY ("autoId") REFERENCES "Auto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
