import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit-log";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; caretakerId: string }> }
) {
  const { id, caretakerId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "LANDLORD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property || property.landlordId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const assignment = await prisma.caretakerAssignment.findUnique({
    where: { propertyId_caretakerId: { propertyId: id, caretakerId } },
  });
  if (!assignment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.caretakerAssignment.delete({ where: { id: assignment.id } });
  await logAudit({
    userId: session.user.id,
    action: "caretaker.remove",
    targetType: "Property",
    targetId: id,
    metadata: { caretakerId },
  });
  return NextResponse.json({ ok: true });
}
