import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageProperty } from "@/lib/authorization";
import { deleteLeaseDocumentFile, isAllowedDocument, uploadLeaseDocument } from "@/lib/storage";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lease = await prisma.lease.findUnique({ where: { id }, include: { unit: true } });
  if (!lease || !(await canManageProperty(session.user.id, session.user.role, lease.unit.propertyId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  const error = isAllowedDocument(file);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const url = await uploadLeaseDocument(lease.id, file);

  if (lease.agreementFileUrl) {
    await deleteLeaseDocumentFile(lease.agreementFileUrl);
  }

  const updated = await prisma.lease.update({
    where: { id: lease.id },
    data: { agreementFileUrl: url, agreementFileName: file.name },
  });

  await prisma.notification.create({
    data: {
      userId: lease.tenantId,
      type: "DOCUMENT_UPLOADED",
      title: "Lease agreement uploaded",
      message: "Your landlord uploaded a lease agreement for you to download and sign.",
      link: "/tenant/dashboard",
    },
  });

  return NextResponse.json({
    agreementFileUrl: updated.agreementFileUrl,
    agreementFileName: updated.agreementFileName,
  });
}
