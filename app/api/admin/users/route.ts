import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUserSchema, ADMIN_CREATABLE_ROLES, SUPER_ADMIN_CREATABLE_ROLES } from "@/lib/validations/admin";
import { normalizePhone } from "@/lib/phone";
import { logAudit } from "@/lib/audit-log";
import { withErrorHandling, readJsonBody } from "@/lib/api-handler";

function generateTempPassword(): string {
  return crypto.randomBytes(6).toString("base64url");
}

export const POST = withErrorHandling(async (request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await readJsonBody(request);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const allowedRoles = (isSuperAdmin ? SUPER_ADMIN_CREATABLE_ROLES : ADMIN_CREATABLE_ROLES).map((r) => r.value);
  if (!allowedRoles.includes(parsed.data.role as (typeof allowedRoles)[number])) {
    return NextResponse.json({ error: "You can't create an account with that role" }, { status: 403 });
  }

  const normalizedPhone = normalizePhone(parsed.data.phone);
  if (!normalizedPhone) {
    return NextResponse.json({ error: "Enter a valid phone number" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
  if (existing) {
    return NextResponse.json(
      { error: `This phone number is already registered as a ${existing.role?.toLowerCase() ?? "different"} account` },
      { status: 409 }
    );
  }

  const tempPassword = generateTempPassword();
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      phone: normalizedPhone,
      email: parsed.data.email || null,
      passwordHash: await bcrypt.hash(tempPassword, 10),
      role: parsed.data.role,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "admin.create-user",
    targetType: "User",
    targetId: user.id,
    metadata: { role: user.role, phone: user.phone },
  });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    tempPassword,
  });
});
