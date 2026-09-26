import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteTenantDocumentFile } from "@/lib/storage";
import { withErrorHandling } from "@/lib/api-handler";

export const DELETE = withErrorHandling(async (_request, { params }) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const document = await prisma.tenantDocument.findUnique({ where: { id } });
  if (!document || document.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.tenantDocument.delete({ where: { id } });
  await deleteTenantDocumentFile(document.url);

  return NextResponse.json({ ok: true });
});
