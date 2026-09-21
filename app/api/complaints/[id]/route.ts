import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { complaintUpdateSchema } from "@/lib/validations/complaint";
import { canManageProperty } from "@/lib/authorization";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: { lease: { include: { unit: { include: { property: true } } } } },
  });
  if (
    !complaint ||
    !(await canManageProperty(session.user.id, session.user.role, complaint.lease.unit.propertyId))
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = complaintUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const updated = await prisma.complaint.update({
    where: { id },
    data: {
      status: parsed.data.status,
      resolutionNote: parsed.data.resolutionNote || null,
    },
  });

  if (updated.status !== complaint.status) {
    await prisma.notification.create({
      data: {
        userId: complaint.tenantId,
        type: "COMPLAINT_UPDATE",
        title: "Complaint update",
        message: `"${complaint.title}" is now ${parsed.data.status.replace("_", " ").toLowerCase()}`,
        link: `/tenant/dashboard`,
      },
    });
  }

  return NextResponse.json(updated);
}
