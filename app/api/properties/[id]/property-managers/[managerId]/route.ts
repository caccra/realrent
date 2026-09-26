import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit-log";
import { withErrorHandling } from "@/lib/api-handler";

export const DELETE = withErrorHandling(async (
  _request,
  { params }
) => {
  const { id, managerId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "LANDLORD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property || property.landlordId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const assignment = await prisma.propertyManagerAssignment.findUnique({
    where: { propertyId_managerId: { propertyId: id, managerId } },
  });
  if (!assignment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.propertyManagerAssignment.delete({ where: { id: assignment.id } });
  await logAudit({
    userId: session.user.id,
    action: "property-manager.remove",
    targetType: "Property",
    targetId: id,
    metadata: { managerId },
  });
  return NextResponse.json({ ok: true });
});
