import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { complaintSchema } from "@/lib/validations/complaint";
import { isAllowedImage, uploadComplaintImage } from "@/lib/storage";
import { withErrorHandling } from "@/lib/api-handler";

const MAX_IMAGES = 6;

export const POST = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TENANT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lease = await prisma.lease.findUnique({
    where: { id },
    include: {
      unit: { include: { property: { include: { caretakerAssignments: true } } } },
    },
  });
  if (!lease || lease.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const parsed = complaintSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_IMAGES) {
    return NextResponse.json({ error: `You can attach at most ${MAX_IMAGES} photos` }, { status: 400 });
  }
  for (const file of files) {
    const error = isAllowedImage(file);
    if (error) return NextResponse.json({ error }, { status: 400 });
  }

  const complaint = await prisma.complaint.create({
    data: {
      leaseId: lease.id,
      tenantId: session.user.id,
      title: parsed.data.title,
      description: parsed.data.description,
    },
  });

  if (files.length > 0) {
    const urls = await Promise.all(files.map((file) => uploadComplaintImage(complaint.id, file)));
    await prisma.complaintImage.createMany({
      data: urls.map((url) => ({ complaintId: complaint.id, url })),
    });
  }

  const message = `${lease.unit.property.name} — ${lease.unit.label}: ${parsed.data.title}`;
  await prisma.notification.createMany({
    data: [
      {
        userId: lease.unit.property.landlordId,
        type: "NEW_COMPLAINT",
        title: "New complaint",
        message,
        link: `/landlord/complaints/${complaint.id}`,
      },
      ...lease.unit.property.caretakerAssignments.map((a) => ({
        userId: a.caretakerId,
        type: "NEW_COMPLAINT" as const,
        title: "New complaint",
        message,
        link: `/caretaker/complaints/${complaint.id}`,
      })),
    ],
  });

  return NextResponse.json(complaint);
});
