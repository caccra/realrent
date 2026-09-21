-- CreateEnum
CREATE TYPE "TenantDocumentType" AS ENUM ('ID', 'PASSPORT', 'LETTER', 'OTHER');

-- AlterTable
ALTER TABLE "Lease" ADD COLUMN     "agreementFileName" TEXT,
ADD COLUMN     "agreementFileUrl" TEXT,
ADD COLUMN     "signedAgreementFileName" TEXT,
ADD COLUMN     "signedAgreementFileUrl" TEXT;

-- CreateTable
CREATE TABLE "TenantDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "TenantDocumentType" NOT NULL,
    "label" TEXT,
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenantDocument_tenantId_idx" ON "TenantDocument"("tenantId");

-- AddForeignKey
ALTER TABLE "TenantDocument" ADD CONSTRAINT "TenantDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
