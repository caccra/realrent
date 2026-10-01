-- CreateEnum
CREATE TYPE "TaxpayerType" AS ENUM ('INDIVIDUAL', 'COMPANY_OR_TRUST');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "taxpayerType" "TaxpayerType" NOT NULL DEFAULT 'INDIVIDUAL';

