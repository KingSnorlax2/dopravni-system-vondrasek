-- CreateTable
CREATE TABLE "Fotka" (
    "id" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "autoId" INTEGER,

    CONSTRAINT "Fotka_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Fotka" ADD CONSTRAINT "Fotka_autoId_fkey" FOREIGN KEY ("autoId") REFERENCES "Auto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
