import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { newMaintenanceRequestSchema } from "@/lib/validations/maintenance";
import { canManageProperty } from "@/lib/authorization";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = newMaintenanceRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  if (!(await canManageProperty(session.user.id, session.user.role, parsed.data.propertyId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (parsed.data.unitId) {
    const unit = await prisma.unit.findUnique({ where: { id: parsed.data.unitId } });
    if (!unit || unit.propertyId !== parsed.data.propertyId) {
      return NextResponse.json({ error: "Unit does not belong to this property" }, { status: 400 });
    }
  }

  const request_ = await prisma.maintenanceRequest.create({
    data: {
      propertyId: parsed.data.propertyId,
      unitId: parsed.data.unitId || null,
      createdById: session.user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      priority: parsed.data.priority,
      scheduledDate: parsed.data.scheduledDate ? new Date(parsed.data.scheduledDate) : null,
      vendor: parsed.data.vendor || null,
      cost: parsed.data.cost ?? null,
    },
  });

  return NextResponse.json(request_);
}
