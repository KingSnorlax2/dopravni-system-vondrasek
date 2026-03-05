-- CreateTable
CREATE TABLE "TransakceFaktura" (
    "id" SERIAL NOT NULL,
    "transakceId" INTEGER NOT NULL,
    "nazev" TEXT NOT NULL,
    "typ" TEXT NOT NULL,
    "obsah" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransakceFaktura_pkey" PRIMARY KEY ("id")
);

-- Migrate existing invoice data to new table
INSERT INTO "TransakceFaktura" ("transakceId", "nazev", "typ", "obsah", "createdAt")
SELECT "id", COALESCE("fakturaNazev", 'faktura'), COALESCE("fakturaTyp", 'application/octet-stream'), "faktura", NOW()
FROM "Transakce"
WHERE "faktura" IS NOT NULL;

-- Add foreign key
ALTER TABLE "TransakceFaktura" ADD CONSTRAINT "TransakceFaktura_transakceId_fkey" FOREIGN KEY ("transakceId") REFERENCES "Transakce"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old columns from Transakce
ALTER TABLE "Transakce" DROP COLUMN IF EXISTS "faktura";
ALTER TABLE "Transakce" DROP COLUMN IF EXISTS "fakturaTyp";
ALTER TABLE "Transakce" DROP COLUMN IF EXISTS "fakturaNazev";
