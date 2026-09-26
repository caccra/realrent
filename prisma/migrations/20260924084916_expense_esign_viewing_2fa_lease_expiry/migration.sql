/*
  Warnings:

  - Added the required column `updatedAt` to the `PropertyInquiry` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('UTILITIES', 'STAFF', 'TAXES', 'INSURANCE', 'MANAGEMENT_FEE', 'OTHER');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'VIEWING_CONFIRMED', 'VIEWING_RESCHEDULED', 'COMPLETED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'LEASE_EXPIRING';
ALTER TYPE "NotificationType" ADD VALUE 'VIEWING_REQUESTED';

-- AlterTable
ALTER TABLE "PropertyInquiry" ADD COLUMN     "requestedViewingAt" TIMESTAMP(3),
ADD COLUMN     "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorEnabledAt" TIMESTAMP(3),
ADD COLUMN     "twoFactorSecret" TEXT;

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'UGX',
    "vendor" TEXT,
    "incurredAt" TIMESTAMP(3) NOT NULL,
    "receiptUrl" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaseSignature" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "signerRole" TEXT NOT NULL,
    "typedName" TEXT NOT NULL,
    "ipAddress" TEXT,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaseSignature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Expense_propertyId_idx" ON "Expense"("propertyId");

-- CreateIndex
CREATE INDEX "Expense_incurredAt_idx" ON "Expense"("incurredAt");

-- CreateIndex
CREATE INDEX "LeaseSignature_leaseId_idx" ON "LeaseSignature"("leaseId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaseSignature_leaseId_signerId_key" ON "LeaseSignature"("leaseId", "signerId");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseSignature" ADD CONSTRAINT "LeaseSignature_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseSignature" ADD CONSTRAINT "LeaseSignature_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
