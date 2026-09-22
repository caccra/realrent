import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateUserRoleSchema, suspendUserSchema } from "@/lib/validations/admin";
import { logAudit } from "@/lib/audit-log";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (id === session.user.id) {
    return NextResponse.json({ error: "You can't change your own role or suspension from here" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));

  if (body.action === "set-role") {
    const parsed = updateUserRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const updated = await prisma.user.update({ where: { id }, data: { role: parsed.data.role } });
    await logAudit({
      userId: session.user.id,
      action: "admin.set-role",
      targetType: "User",
      targetId: id,
      metadata: { from: target.role, to: parsed.data.role },
    });
    return NextResponse.json({ id: updated.id, role: updated.role });
  }

  if (body.action === "suspend") {
    const parsed = suspendUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const updated = await prisma.user.update({
      where: { id },
      data: {
        suspended: parsed.data.suspended,
        suspendedAt: parsed.data.suspended ? new Date() : null,
        suspendedReason: parsed.data.suspended ? parsed.data.reason || null : null,
      },
    });
    await logAudit({
      userId: session.user.id,
      action: parsed.data.suspended ? "admin.suspend-user" : "admin.unsuspend-user",
      targetType: "User",
      targetId: id,
      metadata: { reason: parsed.data.reason ?? null },
    });
    return NextResponse.json({ id: updated.id, suspended: updated.suspended });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
