import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appointPropertyManagerSchema } from "@/lib/validations/property";
import { findOrCreateUserByPhone } from "@/lib/user-provisioning";
import { logAudit } from "@/lib/audit-log";
import { withErrorHandling, readJsonBody } from "@/lib/api-handler";

export const POST = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "LANDLORD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property || property.landlordId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await readJsonBody(request);
  const parsed = appointPropertyManagerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const provisioned = await findOrCreateUserByPhone(parsed.data.phone, parsed.data.name, "PROPERTY_MANAGER");
  if (!provisioned.ok) {
    return NextResponse.json({ error: provisioned.error }, { status: 409 });
  }
  const manager = provisioned.user;

  const existingAssignment = await prisma.propertyManagerAssignment.findUnique({
    where: { propertyId_managerId: { propertyId: property.id, managerId: manager.id } },
  });
  if (existingAssignment) {
    return NextResponse.json(
      { error: "This person is already a property manager for this property" },
      { status: 409 }
    );
  }

  const assignment = await prisma.propertyManagerAssignment.create({
    data: { propertyId: property.id, managerId: manager.id },
    include: { manager: true },
  });

  await logAudit({
    userId: session.user.id,
    action: "property-manager.appoint",
    targetType: "Property",
    targetId: property.id,
    metadata: { managerId: manager.id, managerPhone: manager.phone },
  });

  return NextResponse.json({
    id: assignment.id,
    manager: { id: manager.id, name: manager.name, phone: manager.phone },
    tempPassword: provisioned.tempPassword,
  });
});
