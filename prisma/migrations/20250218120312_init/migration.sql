-- CreateTable
CREATE TABLE "Auto" (
    "id" SERIAL NOT NULL,
    "spz" TEXT NOT NULL,
    "znacka" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "rokVyroby" INTEGER NOT NULL,
    "najezd" INTEGER NOT NULL,
    "stav" TEXT NOT NULL,
    "poznamka" TEXT,
    "datumSTK" TIMESTAMP(3),
    "aktivni" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Auto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fotka" (
    "id" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "autoId" INTEGER,

    CONSTRAINT "Fotka_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "autoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transakce" (
    "id" SERIAL NOT NULL,
    "nazev" TEXT NOT NULL,
    "autoId" INTEGER,
    "castka" DOUBLE PRECISION NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL,
    "typ" TEXT NOT NULL,
    "popis" TEXT NOT NULL,
    "faktura" TEXT,

    CONSTRAINT "Transakce_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "ArchivedAuto" (
    "id" SERIAL NOT NULL,
    "originalId" INTEGER NOT NULL,
    "spz" TEXT NOT NULL,
    "znacka" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "rokVyroby" INTEGER NOT NULL,
    "najezd" INTEGER NOT NULL,
    "stav" TEXT NOT NULL,
    "poznamka" TEXT,
    "datumSTK" TIMESTAMP(3),
    "datumArchivace" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duvodArchivace" TEXT,
    "archivedData" JSONB NOT NULL,

    CONSTRAINT "ArchivedAuto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Oprava" (
    "id" SERIAL NOT NULL,
    "autoId" INTEGER NOT NULL,
    "datumOpravy" TIMESTAMP(3) NOT NULL,
    "popis" TEXT NOT NULL,
    "cena" DOUBLE PRECISION NOT NULL,
    "typOpravy" TEXT NOT NULL,
    "stav" TEXT NOT NULL,
    "servis" TEXT,
    "poznamka" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Oprava_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Auto_spz_key" ON "Auto"("spz");

-- AddForeignKey
ALTER TABLE "Fotka" ADD CONSTRAINT "Fotka_autoId_fkey" FOREIGN KEY ("autoId") REFERENCES "Auto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_autoId_fkey" FOREIGN KEY ("autoId") REFERENCES "Auto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transakce" ADD CONSTRAINT "Transakce_autoId_fkey" FOREIGN KEY ("autoId") REFERENCES "Auto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GPSZaznam" ADD CONSTRAINT "GPSZaznam_autoId_fkey" FOREIGN KEY ("autoId") REFERENCES "Auto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Udrzba" ADD CONSTRAINT "Udrzba_autoId_fkey" FOREIGN KEY ("autoId") REFERENCES "Auto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tankovani" ADD CONSTRAINT "Tankovani_autoId_fkey" FOREIGN KEY ("autoId") REFERENCES "Auto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Oprava" ADD CONSTRAINT "Oprava_autoId_fkey" FOREIGN KEY ("autoId") REFERENCES "Auto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
