import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signLeaseSchema } from "@/lib/validations/signature";
import { canManageProperty } from "@/lib/authorization";
import { logAudit } from "@/lib/audit-log";
import { withErrorHandling, readJsonBody } from "@/lib/api-handler";

function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return request.headers.get("x-real-ip");
}

export const POST = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lease = await prisma.lease.findUnique({ where: { id }, include: { unit: true } });
  if (!lease) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let signerRole: "TENANT" | "LANDLORD";
  if (session.user.role === "TENANT" && lease.tenantId === session.user.id) {
    signerRole = "TENANT";
  } else if (await canManageProperty(session.user.id, session.user.role, lease.unit.propertyId)) {
    signerRole = "LANDLORD";
  } else {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await readJsonBody(request);
  const parsed = signLeaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.leaseSignature.findUnique({
    where: { leaseId_signerId: { leaseId: id, signerId: session.user.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "You have already signed this lease" }, { status: 409 });
  }

  const signature = await prisma.leaseSignature.create({
    data: {
      leaseId: id,
      signerId: session.user.id,
      signerRole,
      typedName: parsed.data.typedName,
      ipAddress: getClientIp(request),
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "lease.sign",
    targetType: "Lease",
    targetId: id,
    metadata: { signerRole, typedName: parsed.data.typedName },
  });

  return NextResponse.json(signature);
});
