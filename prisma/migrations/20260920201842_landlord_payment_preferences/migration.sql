-- AlterTable
ALTER TABLE "User" ADD COLUMN     "acceptsBankTransfer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "acceptsCash" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptsMobileMoney" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "momoNumber" TEXT,
ADD COLUMN     "momoProvider" TEXT;
