-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "deactivatedReason" TEXT;

