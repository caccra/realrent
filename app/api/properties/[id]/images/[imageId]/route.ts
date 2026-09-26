import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deletePropertyImageFile } from "@/lib/storage";
import { canManageProperty } from "@/lib/authorization";
import { withErrorHandling } from "@/lib/api-handler";

export const PATCH = withErrorHandling(async (
  request,
  { params }
) => {
  const { id, imageId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const image = await prisma.propertyImage.findUnique({
    where: { id: imageId },
    include: { property: true },
  });
  if (!image || image.propertyId !== id || !(await canManageProperty(session.user.id, session.user.role, id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  if (body.featured !== true) {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.propertyImage.updateMany({ where: { propertyId: id }, data: { featured: false } }),
    prisma.propertyImage.update({ where: { id: imageId }, data: { featured: true } }),
  ]);

  return NextResponse.json({ ok: true });
});

export const DELETE = withErrorHandling(async (
  _request,
  { params }
) => {
  const { id, imageId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const image = await prisma.propertyImage.findUnique({
    where: { id: imageId },
    include: { property: true },
  });
  if (!image || image.propertyId !== id || !(await canManageProperty(session.user.id, session.user.role, id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.propertyImage.delete({ where: { id: imageId } });

  if (image.featured) {
    const next = await prisma.propertyImage.findFirst({
      where: { propertyId: id },
      orderBy: { order: "asc" },
    });
    if (next) {
      await prisma.propertyImage.update({ where: { id: next.id }, data: { featured: true } });
    }
  }

  await deletePropertyImageFile(image.url);

  return NextResponse.json({ ok: true });
});
