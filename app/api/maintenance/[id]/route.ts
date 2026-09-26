import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maintenanceUpdateSchema } from "@/lib/validations/maintenance";
import { canManageProperty } from "@/lib/authorization";
import { withErrorHandling, readJsonBody } from "@/lib/api-handler";

export const PATCH = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const maintenanceRequest = await prisma.maintenanceRequest.findUnique({ where: { id } });
  const isStaff = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  if (
    !maintenanceRequest ||
    (!isStaff && !(await canManageProperty(session.user.id, session.user.role, maintenanceRequest.propertyId)))
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await readJsonBody(request);
  const parsed = maintenanceUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const updated = await prisma.maintenanceRequest.update({
    where: { id },
    data: {
      status: parsed.data.status,
      scheduledDate: parsed.data.scheduledDate ? new Date(parsed.data.scheduledDate) : null,
      vendor: parsed.data.vendor || null,
      cost: parsed.data.cost ?? null,
      completedAt: parsed.data.status === "COMPLETED" ? new Date() : null,
    },
  });

  return NextResponse.json(updated);
});
