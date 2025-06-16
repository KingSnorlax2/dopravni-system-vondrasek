-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

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
    "thumbnailFotoId" TEXT,
    "thumbnailUrl" TEXT,
    "aktivni" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gpsDeviceId" TEXT,
    "lastLatitude" DOUBLE PRECISION,
    "lastLongitude" DOUBLE PRECISION,
    "lastLocationUpdate" TIMESTAMP(3),

    CONSTRAINT "Auto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fotka" (
    "id" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "autoId" INTEGER,
    "positionX" DOUBLE PRECISION,
    "positionY" DOUBLE PRECISION,
    "scale" DOUBLE PRECISION,

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
CREATE TABLE "Kategorie" (
    "id" SERIAL NOT NULL,
    "nazev" TEXT NOT NULL,

    CONSTRAINT "Kategorie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transakce" (
    "id" SERIAL NOT NULL,
    "nazev" TEXT NOT NULL,
    "castka" DOUBLE PRECISION NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL,
    "typ" TEXT NOT NULL,
    "popis" TEXT NOT NULL,
    "kategorieId" INTEGER,
    "autoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "faktura" TEXT,
    "fakturaTyp" TEXT,
    "fakturaNazev" TEXT,

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
    "id" TEXT NOT NULL,
    "autoId" INTEGER NOT NULL,
    "typ" TEXT NOT NULL,
    "popis" TEXT,
    "datumProvedeni" TIMESTAMP(3) NOT NULL,
    "datumPristi" TIMESTAMP(3),
    "najezdKm" INTEGER NOT NULL,
    "nakladyCelkem" DOUBLE PRECISION NOT NULL,
    "provedeno" BOOLEAN NOT NULL,
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

-- CreateTable
CREATE TABLE "Settings" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "options" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleLocation" (
    "id" TEXT NOT NULL,
    "autoId" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "altitude" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "batteryLevel" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AutoTransakce" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AutoTransakce_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Auto_spz_key" ON "Auto"("spz");

-- CreateIndex
CREATE UNIQUE INDEX "Auto_gpsDeviceId_key" ON "Auto"("gpsDeviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Kategorie_nazev_key" ON "Kategorie"("nazev");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_key_key" ON "Settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");

-- CreateIndex
CREATE INDEX "_AutoTransakce_B_index" ON "_AutoTransakce"("B");

-- AddForeignKey
ALTER TABLE "Fotka" ADD CONSTRAINT "Fotka_autoId_fkey" FOREIGN KEY ("autoId") REFERENCES "Auto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_autoId_fkey" FOREIGN KEY ("autoId") REFERENCES "Auto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transakce" ADD CONSTRAINT "Transakce_kategorieId_fkey" FOREIGN KEY ("kategorieId") REFERENCES "Kategorie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "VehicleLocation" ADD CONSTRAINT "VehicleLocation_autoId_fkey" FOREIGN KEY ("autoId") REFERENCES "Auto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AutoTransakce" ADD CONSTRAINT "_AutoTransakce_A_fkey" FOREIGN KEY ("A") REFERENCES "Auto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AutoTransakce" ADD CONSTRAINT "_AutoTransakce_B_fkey" FOREIGN KEY ("B") REFERENCES "Transakce"("id") ON DELETE CASCADE ON UPDATE CASCADE;
