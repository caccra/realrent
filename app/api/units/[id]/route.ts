import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unitSchema } from "@/lib/validations/property";
import { canManageProperty } from "@/lib/authorization";
import { withErrorHandling, readJsonBody } from "@/lib/api-handler";

export const PATCH = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const unit = await prisma.unit.findUnique({ where: { id }, include: { property: true } });
  if (!unit || !(await canManageProperty(session.user.id, session.user.role, unit.propertyId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await readJsonBody(request);
  const parsed = unitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const updated = await prisma.unit.update({
    where: { id },
    data: {
      label: parsed.data.label,
      bedrooms: parsed.data.bedrooms,
      bathrooms: parsed.data.bathrooms ?? null,
      otherRooms: parsed.data.otherRooms || null,
      rentAmount: parsed.data.rentAmount,
      currency: parsed.data.currency,
      billingCycle: parsed.data.billingCycle,
      floor: parsed.data.floor || null,
      shopNumber: parsed.data.shopNumber || null,
      dimensions: parsed.data.dimensions || null,
    },
  });

  return NextResponse.json(updated);
});

export const DELETE = withErrorHandling(async (_request, { params }) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const unit = await prisma.unit.findUnique({ where: { id }, include: { property: true } });
  if (!unit || !(await canManageProperty(session.user.id, session.user.role, unit.propertyId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const leaseCount = await prisma.lease.count({ where: { unitId: id } });
  if (leaseCount > 0) {
    return NextResponse.json(
      { error: "This unit has lease history and can't be deleted" },
      { status: 409 }
    );
  }

  await prisma.unit.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
