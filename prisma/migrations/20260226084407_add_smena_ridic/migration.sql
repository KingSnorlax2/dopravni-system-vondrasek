-- CreateTable
CREATE TABLE "SmenaRidic" (
    "id" SERIAL NOT NULL,
    "ridicEmail" TEXT NOT NULL,
    "datum" DATE NOT NULL,
    "casPrichodu" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "casOdjezdu" TIMESTAMP(3),
    "casNavratu" TIMESTAMP(3),
    "cisloTrasy" TEXT,

    CONSTRAINT "SmenaRidic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SmenaRidic_ridicEmail_datum_idx" ON "SmenaRidic"("ridicEmail", "datum");
