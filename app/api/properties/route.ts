import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { propertySchema } from "@/lib/validations/property";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "LANDLORD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = propertySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const property = await prisma.property.create({
    data: {
      landlordId: session.user.id,
      name: parsed.data.name,
      address: parsed.data.address,
      location: parsed.data.location || null,
      description: parsed.data.description || null,
      usage: parsed.data.usage || null,
      propertyType: parsed.data.propertyType || null,
      amenities: parsed.data.amenities,
      listingType: parsed.data.listingType,
      salePrice: parsed.data.listingType === "SALE" ? parsed.data.salePrice : null,
      saleBedrooms: parsed.data.listingType === "SALE" ? parsed.data.saleBedrooms ?? null : null,
      saleBathrooms: parsed.data.listingType === "SALE" ? parsed.data.saleBathrooms ?? null : null,
    },
  });

  return NextResponse.json(property);
}
