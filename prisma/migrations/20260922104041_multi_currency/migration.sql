-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('UGX', 'USD');

-- AlterTable
ALTER TABLE "Lease" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'UGX';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'UGX';

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "saleCurrency" "Currency" NOT NULL DEFAULT 'UGX';

-- AlterTable
ALTER TABLE "RentInvoice" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'UGX';

-- AlterTable
ALTER TABLE "Unit" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'UGX';
