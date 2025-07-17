/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Add allowedPages and defaultLandingPage to Role
ALTER TABLE "Role" ADD COLUMN "allowedPages" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Role" ADD COLUMN "defaultLandingPage" TEXT;
