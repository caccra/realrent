import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appointCaretakerSchema } from "@/lib/validations/property";
import { findOrCreateUserByPhone } from "@/lib/user-provisioning";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "LANDLORD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property || property.landlordId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = appointCaretakerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const provisioned = await findOrCreateUserByPhone(parsed.data.phone, parsed.data.name, "CARETAKER");
  if (!provisioned.ok) {
    return NextResponse.json({ error: provisioned.error }, { status: 409 });
  }
  const caretaker = provisioned.user;

  const existingAssignment = await prisma.caretakerAssignment.findUnique({
    where: { propertyId_caretakerId: { propertyId: property.id, caretakerId: caretaker.id } },
  });
  if (existingAssignment) {
    return NextResponse.json(
      { error: "This person is already a caretaker for this property" },
      { status: 409 }
    );
  }

  const assignment = await prisma.caretakerAssignment.create({
    data: { propertyId: property.id, caretakerId: caretaker.id },
    include: { caretaker: true },
  });

  return NextResponse.json({
    id: assignment.id,
    caretaker: { id: caretaker.id, name: caretaker.name, phone: caretaker.phone },
    tempPassword: provisioned.tempPassword,
  });
}
