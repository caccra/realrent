import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageTenant } from "@/lib/authorization";
import { TENANT_DOCUMENT_TYPES } from "@/lib/validations/tenant-document";
import { logAudit } from "@/lib/audit-log";
import { withErrorHandling } from "@/lib/api-handler";

export const PATCH = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const document = await prisma.tenantDocument.findUnique({ where: { id } });
  if (!document || !(await canManageTenant(session.user.id, session.user.role, document.tenantId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const verified = body.verified !== false;

  const updated = await prisma.tenantDocument.update({
    where: { id },
    data: verified
      ? { verified: true, verifiedAt: new Date(), verifiedById: session.user.id }
      : { verified: false, verifiedAt: null, verifiedById: null },
  });

  if (verified) {
    const label = TENANT_DOCUMENT_TYPES.find((t) => t.value === document.type)?.label ?? document.type;
    await prisma.notification.create({
      data: {
        userId: document.tenantId,
        type: "DOCUMENT_VERIFIED",
        title: "Document verified",
        message: `Your ${label} has been verified.`,
        link: "/tenant/dashboard",
      },
    });
  }

  await logAudit({
    userId: session.user.id,
    action: verified ? "document.verify" : "document.unverify",
    targetType: "TenantDocument",
    targetId: document.id,
    metadata: { tenantId: document.tenantId, type: document.type },
  });

  return NextResponse.json(updated);
});
