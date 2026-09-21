import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unitSchema } from "@/lib/validations/property";

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
  const parsed = unitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const unit = await prisma.unit.create({
    data: {
      propertyId: property.id,
      label: parsed.data.label,
      bedrooms: parsed.data.bedrooms,
      bathrooms: parsed.data.bathrooms ?? null,
      otherRooms: parsed.data.otherRooms || null,
      rentAmount: parsed.data.rentAmount,
      billingCycle: parsed.data.billingCycle,
      floor: parsed.data.floor || null,
      shopNumber: parsed.data.shopNumber || null,
      dimensions: parsed.data.dimensions || null,
    },
  });

  return NextResponse.json(unit);
}
