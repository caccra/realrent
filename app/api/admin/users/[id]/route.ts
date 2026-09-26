import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateUserRoleSchema, suspendUserSchema, updateUserProfileSchema } from "@/lib/validations/admin";
import { normalizePhone } from "@/lib/phone";
import { logAudit } from "@/lib/audit-log";
import { withErrorHandling, readJsonBody } from "@/lib/api-handler";

export const PATCH = withErrorHandling(async (request, { params }) => {
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

  const body = (await readJsonBody(request)) as Record<string, unknown>;

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

  if (body.action === "edit-profile") {
    const parsed = updateUserProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const normalizedPhone = normalizePhone(parsed.data.phone);
    if (!normalizedPhone) {
      return NextResponse.json({ error: "Enter a valid phone number" }, { status: 400 });
    }
    const phoneOwner = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (phoneOwner && phoneOwner.id !== id) {
      return NextResponse.json({ error: "This phone number is already linked to another account" }, { status: 409 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { name: parsed.data.name, phone: normalizedPhone, email: parsed.data.email || null },
    });
    await logAudit({
      userId: session.user.id,
      action: "admin.edit-user",
      targetType: "User",
      targetId: id,
      metadata: { name: updated.name, phone: updated.phone },
    });
    return NextResponse.json({ id: updated.id, name: updated.name, phone: updated.phone, email: updated.email });
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
});

export const DELETE = withErrorHandling(async (_request, { params }) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (id === session.user.id) {
    return NextResponse.json({ error: "You can't delete your own account from here" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    include: { _count: { select: { properties: true, leasesAsTenant: true } } },
  });
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (target.role === "LANDLORD" && target._count.properties > 0) {
    return NextResponse.json(
      {
        error: `This landlord still owns ${target._count.properties} propert${target._count.properties === 1 ? "y" : "ies"}. Reassign or delete those first — deleting the account would permanently destroy their lease, invoice, and payment history.`,
      },
      { status: 409 }
    );
  }
  if (target.role === "TENANT" && target._count.leasesAsTenant > 0) {
    return NextResponse.json(
      {
        error: `This tenant has ${target._count.leasesAsTenant} lease${target._count.leasesAsTenant === 1 ? "" : "s"} on record. Deleting the account would permanently destroy that lease, invoice, and payment history.`,
      },
      { status: 409 }
    );
  }

  await prisma.user.delete({ where: { id } });
  await logAudit({
    userId: session.user.id,
    action: "admin.delete-user",
    targetType: "User",
    targetId: id,
    metadata: { name: target.name, phone: target.phone, role: target.role },
  });

  return NextResponse.json({ ok: true });
});
