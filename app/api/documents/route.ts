import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tenantDocumentSchema } from "@/lib/validations/tenant-document";
import { isAllowedDocument, uploadTenantDocument } from "@/lib/storage";

const MAX_DOCUMENTS = 12;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TENANT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existingCount = await prisma.tenantDocument.count({ where: { tenantId: session.user.id } });
  if (existingCount >= MAX_DOCUMENTS) {
    return NextResponse.json({ error: `You can upload at most ${MAX_DOCUMENTS} documents` }, { status: 400 });
  }

  const formData = await request.formData();
  const parsed = tenantDocumentSchema.safeParse({
    type: formData.get("type"),
    label: formData.get("label"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  const error = isAllowedDocument(file);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const url = await uploadTenantDocument(session.user.id, file);

  const document = await prisma.tenantDocument.create({
    data: {
      tenantId: session.user.id,
      type: parsed.data.type,
      label: parsed.data.label || null,
      url,
      fileName: file.name,
    },
  });

  return NextResponse.json(document);
}
