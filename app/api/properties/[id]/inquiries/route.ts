import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { propertyInquirySchema } from "@/lib/validations/property";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    include: { caretakerAssignments: true },
  });
  if (!property) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = propertyInquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const inquiry = await prisma.propertyInquiry.create({
    data: {
      propertyId: property.id,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      message: parsed.data.message,
    },
  });

  const notifyMessage = `${parsed.data.name} is interested in ${property.name}: "${parsed.data.message.slice(0, 100)}"`;
  await prisma.notification.createMany({
    data: [
      {
        userId: property.landlordId,
        type: "PROPERTY_INQUIRY",
        title: "New inquiry",
        message: notifyMessage,
        link: `/landlord/properties/${property.id}`,
      },
      ...property.caretakerAssignments.map((a) => ({
        userId: a.caretakerId,
        type: "PROPERTY_INQUIRY" as const,
        title: "New inquiry",
        message: notifyMessage,
        link: `/caretaker/dashboard`,
      })),
    ],
  });

  return NextResponse.json({ ok: true, id: inquiry.id });
}
