import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAllowedImage, uploadPropertyImage } from "@/lib/storage";
import { canManageProperty } from "@/lib/authorization";

const MAX_IMAGES_PER_PROPERTY = 12;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const property = await prisma.property.findUnique({
    where: { id },
    include: { _count: { select: { images: true } } },
  });
  if (!property || !(await canManageProperty(session.user.id, session.user.role, id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }
  if (property._count.images + files.length > MAX_IMAGES_PER_PROPERTY) {
    return NextResponse.json(
      { error: `A property can have at most ${MAX_IMAGES_PER_PROPERTY} photos` },
      { status: 400 }
    );
  }

  for (const file of files) {
    const error = isAllowedImage(file);
    if (error) return NextResponse.json({ error }, { status: 400 });
  }

  const uploaded = await Promise.all(files.map((file) => uploadPropertyImage(property.id, file)));

  const isFirstUpload = property._count.images === 0;

  const images = await prisma.$transaction(
    uploaded.map((url, index) =>
      prisma.propertyImage.create({
        data: {
          propertyId: property.id,
          url,
          order: property._count.images + index,
          featured: isFirstUpload && index === 0,
        },
      })
    )
  );

  return NextResponse.json(images);
}
