import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteLeaseDocumentFile, isAllowedDocument, uploadLeaseDocument } from "@/lib/storage";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TENANT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lease = await prisma.lease.findUnique({
    where: { id },
    include: { unit: { include: { property: { include: { caretakerAssignments: true } } } } },
  });
  if (!lease || lease.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  const error = isAllowedDocument(file);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const url = await uploadLeaseDocument(`${lease.id}-signed`, file);

  if (lease.signedAgreementFileUrl) {
    await deleteLeaseDocumentFile(lease.signedAgreementFileUrl);
  }

  const updated = await prisma.lease.update({
    where: { id: lease.id },
    data: { signedAgreementFileUrl: url, signedAgreementFileName: file.name },
  });

  const message = `${lease.unit.property.name} — ${lease.unit.label}: signed agreement uploaded`;
  await prisma.notification.createMany({
    data: [
      {
        userId: lease.unit.property.landlordId,
        type: "DOCUMENT_UPLOADED",
        title: "Signed agreement uploaded",
        message,
        link: `/landlord/leases/${lease.id}`,
      },
      ...lease.unit.property.caretakerAssignments.map((a) => ({
        userId: a.caretakerId,
        type: "DOCUMENT_UPLOADED" as const,
        title: "Signed agreement uploaded",
        message,
        link: `/caretaker/leases/${lease.id}`,
      })),
    ],
  });

  return NextResponse.json({
    signedAgreementFileUrl: updated.signedAgreementFileUrl,
    signedAgreementFileName: updated.signedAgreementFileName,
  });
}
