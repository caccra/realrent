import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { propertySchema } from "@/lib/validations/property";
import { deletePropertyImageFile } from "@/lib/storage";
import { logAudit } from "@/lib/audit-log";
import { canManageProperty } from "@/lib/authorization";
import { withErrorHandling, readJsonBody } from "@/lib/api-handler";

export const PATCH = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property || !(await canManageProperty(session.user.id, session.user.role, id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await readJsonBody(request);
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
      listingType: parsed.data.listingType,
      salePrice: parsed.data.listingType === "SALE" ? parsed.data.salePrice : null,
      saleCurrency: parsed.data.saleCurrency,
      saleBedrooms: parsed.data.listingType === "SALE" ? parsed.data.saleBedrooms ?? null : null,
      saleBathrooms: parsed.data.listingType === "SALE" ? parsed.data.saleBathrooms ?? null : null,
    },
  });

  return NextResponse.json(updated);
});

export const DELETE = withErrorHandling(async (_request, { params }) => {
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
  await logAudit({
    userId: session.user.id,
    action: "property.delete",
    targetType: "Property",
    targetId: property.id,
    metadata: { name: property.name },
  });
  return NextResponse.json({ ok: true });
});
