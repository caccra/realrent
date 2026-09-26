import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit-log";
import { z } from "zod";
import { withErrorHandling, readJsonBody } from "@/lib/api-handler";

const setActiveSchema = z.object({
  active: z.boolean(),
  reason: z.string().trim().max(500, "Too long").optional().or(z.literal("")),
});

export const PATCH = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await readJsonBody(request)) as { action?: string };
  if (body.action !== "set-active") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  const parsed = setActiveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const updated = await prisma.property.update({
    where: { id },
    data: {
      active: parsed.data.active,
      deactivatedReason: parsed.data.active ? null : parsed.data.reason || null,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: parsed.data.active ? "admin.activate-property" : "admin.deactivate-property",
    targetType: "Property",
    targetId: id,
    metadata: { reason: parsed.data.reason ?? null },
  });

  return NextResponse.json({ id: updated.id, active: updated.active });
});
