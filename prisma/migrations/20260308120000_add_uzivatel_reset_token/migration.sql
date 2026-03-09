-- AlterTable
ALTER TABLE "Uzivatel" ADD COLUMN "resetToken" TEXT,
ADD COLUMN "resetTokenExpiry" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Uzivatel_resetToken_key" ON "Uzivatel"("resetToken");
