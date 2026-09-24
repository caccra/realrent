-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'PROPERTY_MANAGER';

-- CreateTable
CREATE TABLE "PropertyManagerAssignment" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyManagerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyManagerAssignment_managerId_idx" ON "PropertyManagerAssignment"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyManagerAssignment_propertyId_managerId_key" ON "PropertyManagerAssignment"("propertyId", "managerId");

-- AddForeignKey
ALTER TABLE "PropertyManagerAssignment" ADD CONSTRAINT "PropertyManagerAssignment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyManagerAssignment" ADD CONSTRAINT "PropertyManagerAssignment_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
