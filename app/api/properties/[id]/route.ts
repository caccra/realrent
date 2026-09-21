import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { propertySchema } from "@/lib/validations/property";
import { deletePropertyImageFile } from "@/lib/storage";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
  const parsed = propertySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const updated = await prisma.property.update({
    where: { id },
    data: {
      name: parsed.data.name,
      address: parsed.data.address,
      location: parsed.data.location || null,
      description: parsed.data.description || null,
      usage: parsed.data.usage || null,
      propertyType: parsed.data.propertyType || null,
      amenities: parsed.data.amenities,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "LANDLORD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const property = await prisma.property.findUnique({
    where: { id },
    include: { _count: { select: { units: true } }, images: true },
  });
  if (!property || property.landlordId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (property._count.units > 0) {
    return NextResponse.json(
      { error: "Remove all units from this property before deleting it" },
      { status: 409 }
    );
  }

  await prisma.property.delete({ where: { id } });
  await Promise.all(property.images.map((img) => deletePropertyImageFile(img.url)));
  return NextResponse.json({ ok: true });
}
