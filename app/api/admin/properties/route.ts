import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { propertySchema } from "@/lib/validations/property";
import { logAudit } from "@/lib/audit-log";
import { withErrorHandling, readJsonBody } from "@/lib/api-handler";

export const POST = withErrorHandling(async (request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await readJsonBody(request)) as Record<string, unknown>;

  const landlordId = typeof body.landlordId === "string" ? body.landlordId : "";
  if (!landlordId) {
    return NextResponse.json({ error: "Select a landlord" }, { status: 400 });
  }
  const landlord = await prisma.user.findUnique({ where: { id: landlordId } });
  if (!landlord || landlord.role !== "LANDLORD") {
    return NextResponse.json({ error: "That account isn't a landlord" }, { status: 400 });
  }

  const parsed = propertySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const property = await prisma.property.create({
    data: {
      landlordId,
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

  await logAudit({
    userId: session.user.id,
    action: "admin.create-property",
    targetType: "Property",
    targetId: property.id,
    metadata: { name: property.name, landlordId },
  });

  return NextResponse.json(property);
});
