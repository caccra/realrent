-- CreateEnum
CREATE TYPE "PropertyUsage" AS ENUM ('RESIDENTIAL', 'COMMERCIAL');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "usage" "PropertyUsage";
