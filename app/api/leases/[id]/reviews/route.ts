import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validations/review";
import type { ReviewDirection } from "@prisma/client";
import { withErrorHandling, readJsonBody } from "@/lib/api-handler";

export const POST = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lease = await prisma.lease.findUnique({
    where: { id },
    include: { unit: { include: { property: true } } },
  });
  if (!lease) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let authorId: string;
  let targetId: string;
  let direction: ReviewDirection;
  let propertyId: string | null = null;

  if (session.user.role === "TENANT" && lease.tenantId === session.user.id) {
    authorId = session.user.id;
    targetId = lease.unit.property.landlordId;
    direction = "TENANT_TO_LANDLORD";
    propertyId = lease.unit.propertyId;
  } else if (session.user.role === "LANDLORD" && lease.unit.property.landlordId === session.user.id) {
    authorId = session.user.id;
    targetId = lease.tenantId;
    direction = "LANDLORD_TO_TENANT";
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await readJsonBody(request);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const review = await prisma.review.upsert({
    where: { authorId_leaseId_direction: { authorId, leaseId: lease.id, direction } },
    update: { rating: parsed.data.rating, comment: parsed.data.comment || null, propertyId },
    create: {
      authorId,
      targetId,
      leaseId: lease.id,
      propertyId,
      direction,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    },
  });

  return NextResponse.json(review);
});
