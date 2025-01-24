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
