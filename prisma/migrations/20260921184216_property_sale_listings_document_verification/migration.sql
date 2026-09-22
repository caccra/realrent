-- CreateEnum
CREATE TYPE "PropertyListingType" AS ENUM ('RENTAL', 'SALE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PROPERTY_INQUIRY';
ALTER TYPE "NotificationType" ADD VALUE 'DOCUMENT_VERIFIED';

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "listingType" "PropertyListingType" NOT NULL DEFAULT 'RENTAL',
ADD COLUMN     "saleBathrooms" INTEGER,
ADD COLUMN     "saleBedrooms" INTEGER,
ADD COLUMN     "salePrice" DECIMAL(14,2);

-- AlterTable
ALTER TABLE "TenantDocument" ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedById" TEXT;

-- CreateTable
CREATE TABLE "PropertyInquiry" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyInquiry_propertyId_idx" ON "PropertyInquiry"("propertyId");

-- AddForeignKey
ALTER TABLE "PropertyInquiry" ADD CONSTRAINT "PropertyInquiry_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantDocument" ADD CONSTRAINT "TenantDocument_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
