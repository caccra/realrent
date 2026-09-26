import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateInquirySchema } from "@/lib/validations/property";
import { canManageProperty } from "@/lib/authorization";
import { withErrorHandling, readJsonBody } from "@/lib/api-handler";

export const PATCH = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const inquiry = await prisma.propertyInquiry.findUnique({ where: { id } });
  if (!inquiry || !(await canManageProperty(session.user.id, session.user.role, inquiry.propertyId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await readJsonBody(request);
  const parsed = updateInquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const updated = await prisma.propertyInquiry.update({
    where: { id },
    data: {
      status: parsed.data.status,
      requestedViewingAt: parsed.data.requestedViewingAt ? new Date(parsed.data.requestedViewingAt) : undefined,
    },
  });

  return NextResponse.json(updated);
});
