-- CreateTable
CREATE TABLE "ComplaintImage" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComplaintImage_complaintId_idx" ON "ComplaintImage"("complaintId");

-- AddForeignKey
ALTER TABLE "ComplaintImage" ADD CONSTRAINT "ComplaintImage_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
