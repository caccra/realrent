-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'INVOICE_GENERATED';

-- AlterTable
ALTER TABLE "RentInvoice" ADD COLUMN     "invoiceNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "RentInvoice_invoiceNumber_key" ON "RentInvoice"("invoiceNumber");

