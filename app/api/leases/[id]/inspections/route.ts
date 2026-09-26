import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inspectionSchema } from "@/lib/validations/inspection";
import { canManageProperty } from "@/lib/authorization";
import { isAllowedImage, uploadInspectionPhoto } from "@/lib/storage";
import { withErrorHandling } from "@/lib/api-handler";

const MAX_PHOTOS = 12;

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
  if (!lease || !(await canManageProperty(session.user.id, session.user.role, lease.unit.propertyId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const itemsRaw = formData.get("items");
  let items: unknown;
  try {
    items = JSON.parse(typeof itemsRaw === "string" ? itemsRaw : "[]");
  } catch {
    return NextResponse.json({ error: "Invalid checklist data" }, { status: 400 });
  }

  const parsed = inspectionSchema.safeParse({
    type: formData.get("type"),
    notes: formData.get("notes"),
    items,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.inspection.findUnique({
    where: { leaseId_type: { leaseId: lease.id, type: parsed.data.type } },
  });
  if (existing) {
    return NextResponse.json(
      { error: `A ${parsed.data.type === "MOVE_IN" ? "move-in" : "move-out"} inspection already exists for this lease` },
      { status: 409 }
    );
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_PHOTOS) {
    return NextResponse.json({ error: `You can attach at most ${MAX_PHOTOS} photos` }, { status: 400 });
  }
  for (const file of files) {
    const error = isAllowedImage(file);
    if (error) return NextResponse.json({ error }, { status: 400 });
  }

  const inspection = await prisma.inspection.create({
    data: {
      leaseId: lease.id,
      type: parsed.data.type,
      conductedById: session.user.id,
      notes: parsed.data.notes || null,
      items: {
        create: parsed.data.items.map((item) => ({
          label: item.label,
          condition: item.condition,
          note: item.note || null,
        })),
      },
    },
  });

  if (files.length > 0) {
    const urls = await Promise.all(files.map((file) => uploadInspectionPhoto(inspection.id, file)));
    await prisma.inspectionPhoto.createMany({
      data: urls.map((url) => ({ inspectionId: inspection.id, url })),
    });
  }

  return NextResponse.json({ id: inspection.id });
});
