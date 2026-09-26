import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { propertyInquirySchema } from "@/lib/validations/property";
import type { NotificationType } from "@prisma/client";
import { withErrorHandling, readJsonBody } from "@/lib/api-handler";

export const POST = withErrorHandling(async (request, { params }) => {
  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    include: { caretakerAssignments: true, propertyManagerAssignments: true },
  });
  if (!property) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await readJsonBody(request);
  const parsed = propertyInquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const requestedViewingAt = parsed.data.requestedViewingAt ? new Date(parsed.data.requestedViewingAt) : null;

  const inquiry = await prisma.propertyInquiry.create({
    data: {
      propertyId: property.id,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      message: parsed.data.message,
      requestedViewingAt,
    },
  });

  const isViewingRequest = requestedViewingAt != null;
  const notificationType: NotificationType = isViewingRequest ? "VIEWING_REQUESTED" : "PROPERTY_INQUIRY";
  const notifyMessage = isViewingRequest
    ? `${parsed.data.name} would like to view ${property.name} on ${requestedViewingAt!.toLocaleString("en-UG")}.`
    : `${parsed.data.name} is interested in ${property.name}: "${parsed.data.message.slice(0, 100)}"`;
  const title = isViewingRequest ? "Viewing requested" : "New inquiry";

  await prisma.notification.createMany({
    data: [
      {
        userId: property.landlordId,
        type: notificationType,
        title,
        message: notifyMessage,
        link: `/landlord/properties/${property.id}`,
      },
      ...property.propertyManagerAssignments.map((a) => ({
        userId: a.managerId,
        type: notificationType,
        title,
        message: notifyMessage,
        link: `/landlord/properties/${property.id}`,
      })),
      ...property.caretakerAssignments.map((a) => ({
        userId: a.caretakerId,
        type: notificationType,
        title,
        message: notifyMessage,
        link: `/caretaker/dashboard`,
      })),
    ],
  });

  return NextResponse.json({ ok: true, id: inquiry.id });
});
