/*
  Warnings:

  - The values [manage_users,manage_vehicles] on the enum `PermissionKey` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `archivedData` on the `ArchivedAuto` table. All the data in the column will be lost.
  - You are about to drop the column `datumArchivace` on the `ArchivedAuto` table. All the data in the column will be lost.
  - You are about to drop the column `duvodArchivace` on the `ArchivedAuto` table. All the data in the column will be lost.
  - You are about to drop the column `originalId` on the `ArchivedAuto` table. All the data in the column will be lost.
  - You are about to drop the column `celkovaCena` on the `Tankovani` table. All the data in the column will be lost.
  - You are about to drop the column `cenaZaLitr` on the `Tankovani` table. All the data in the column will be lost.
  - You are about to drop the column `mistoTankovani` on the `Tankovani` table. All the data in the column will be lost.
  - You are about to drop the column `mnozstviLitru` on the `Tankovani` table. All the data in the column will be lost.
  - You are about to drop the column `najezdKm` on the `Tankovani` table. All the data in the column will be lost.
  - You are about to drop the column `plnaNadrz` on the `Tankovani` table. All the data in the column will be lost.
  - You are about to drop the column `typPaliva` on the `Tankovani` table. All the data in the column will be lost.
  - The primary key for the `Udrzba` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `datumPristi` on the `Udrzba` table. All the data in the column will be lost.
  - You are about to drop the column `datumProvedeni` on the `Udrzba` table. All the data in the column will be lost.
  - You are about to drop the column `dokumenty` on the `Udrzba` table. All the data in the column will be lost.
  - You are about to drop the column `najezdKm` on the `Udrzba` table. All the data in the column will be lost.
  - You are about to drop the column `nakladyCelkem` on the `Udrzba` table. All the data in the column will be lost.
  - You are about to drop the column `provedeno` on the `Udrzba` table. All the data in the column will be lost.
  - You are about to drop the column `typ` on the `Udrzba` table. All the data in the column will be lost.
  - The `id` column on the `Udrzba` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[roleId,permission]` on the table `RolePermission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `ArchivedAuto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Role` table without a default value. This is not possible if the table is not empty.
  - Added the required column `displayName` to the `Role` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Role` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cena` to the `Tankovani` table without a default value. This is not possible if the table is not empty.
  - Added the required column `litry` to the `Tankovani` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Tankovani` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cena` to the `Udrzba` table without a default value. This is not possible if the table is not empty.
  - Added the required column `datumUdrzby` to the `Udrzba` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stav` to the `Udrzba` table without a default value. This is not possible if the table is not empty.
  - Added the required column `typUdrzby` to the `Udrzba` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Udrzba` table without a default value. This is not possible if the table is not empty.
  - Made the column `popis` on table `Udrzba` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- AlterEnum
BEGIN;
CREATE TYPE "PermissionKey_new" AS ENUM ('view_dashboard', 'customize_dashboard', 'export_dashboard', 'view_users', 'create_users', 'edit_users', 'delete_users', 'assign_roles', 'manage_roles', 'view_vehicles', 'create_vehicles', 'edit_vehicles', 'delete_vehicles', 'track_vehicles', 'assign_vehicles', 'view_transactions', 'create_transactions', 'edit_transactions', 'delete_transactions', 'approve_expenses', 'view_financial_reports', 'view_maintenance', 'schedule_maintenance', 'approve_maintenance', 'edit_maintenance', 'delete_maintenance', 'track_service_history', 'view_distribution', 'manage_distribution', 'assign_routes', 'edit_routes', 'system_settings', 'view_audit_logs', 'manage_departments', 'backup_restore', 'view_reports', 'generate_reports', 'export_reports', 'view_analytics', 'driver_access', 'view_personal_history', 'report_issues', 'update_vehicle_status');
ALTER TABLE "RolePermission" ALTER COLUMN "permission" TYPE "PermissionKey_new" USING ("permission"::text::"PermissionKey_new");
ALTER TYPE "PermissionKey" RENAME TO "PermissionKey_old";
ALTER TYPE "PermissionKey_new" RENAME TO "PermissionKey";
DROP TYPE "PermissionKey_old";
COMMIT;

-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'SUSPENDED';

-- AlterTable
ALTER TABLE "ArchivedAuto" DROP COLUMN "archivedData",
DROP COLUMN "datumArchivace",
DROP COLUMN "duvodArchivace",
DROP COLUMN "originalId",
ADD COLUMN     "aktivni" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "archivedBy" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "thumbnailFotoId" TEXT,
ADD COLUMN     "thumbnailUrl" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Auto" ADD COLUMN     "assignedDriver" TEXT,
ADD COLUMN     "department" TEXT;

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "color" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "displayName" TEXT NOT NULL,
ADD COLUMN     "dynamicRules" JSONB,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Tankovani" DROP COLUMN "celkovaCena",
DROP COLUMN "cenaZaLitr",
DROP COLUMN "mistoTankovani",
DROP COLUMN "mnozstviLitru",
DROP COLUMN "najezdKm",
DROP COLUMN "plnaNadrz",
DROP COLUMN "typPaliva",
ADD COLUMN     "cena" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "litry" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Transakce" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Udrzba" DROP CONSTRAINT "Udrzba_pkey",
DROP COLUMN "datumPristi",
DROP COLUMN "datumProvedeni",
DROP COLUMN "dokumenty",
DROP COLUMN "najezdKm",
DROP COLUMN "nakladyCelkem",
DROP COLUMN "provedeno",
DROP COLUMN "typ",
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "cena" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "datumUdrzby" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "servis" TEXT,
ADD COLUMN     "status" "MaintenanceStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "stav" TEXT NOT NULL,
ADD COLUMN     "typUdrzby" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "popis" SET NOT NULL,
ADD CONSTRAINT "Udrzba_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "position" TEXT,
ADD COLUMN     "trustScore" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "updatedBy" TEXT;

-- AlterTable
ALTER TABLE "UserRole" ADD COLUMN     "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "assignedBy" TEXT;

-- CreateTable
CREATE TABLE "RoleDepartmentAssignment" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "department" TEXT NOT NULL,
    "canManage" BOOLEAN NOT NULL DEFAULT false,
    "canView" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RoleDepartmentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleAuditLog" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "RoleAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoleDepartmentAssignment_roleId_department_key" ON "RoleDepartmentAssignment"("roleId", "department");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permission_key" ON "RolePermission"("roleId", "permission");

-- AddForeignKey
ALTER TABLE "Auto" ADD CONSTRAINT "Auto_assignedDriver_fkey" FOREIGN KEY ("assignedDriver") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleDepartmentAssignment" ADD CONSTRAINT "RoleDepartmentAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
