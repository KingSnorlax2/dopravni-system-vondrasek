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

-- AddForeignKey
ALTER TABLE "Oprava" ADD CONSTRAINT "Oprava_autoId_fkey" FOREIGN KEY ("autoId") REFERENCES "Auto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
