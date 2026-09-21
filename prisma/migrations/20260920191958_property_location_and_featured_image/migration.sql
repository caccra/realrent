-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "PropertyImage" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;
