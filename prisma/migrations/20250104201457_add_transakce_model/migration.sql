-- CreateTable
CREATE TABLE "Transakce" (
    "id" SERIAL NOT NULL,
    "autoId" INTEGER NOT NULL,
    "castka" DOUBLE PRECISION NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL,
    "typ" TEXT NOT NULL,

    CONSTRAINT "Transakce_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transakce" ADD CONSTRAINT "Transakce_autoId_fkey" FOREIGN KEY ("autoId") REFERENCES "Auto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
