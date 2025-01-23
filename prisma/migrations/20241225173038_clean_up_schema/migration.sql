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

    CONSTRAINT "Auto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Auto_spz_key" ON "Auto"("spz");
