import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTwoFactorToken } from "@/lib/two-factor";
import { logAudit } from "@/lib/audit-log";
import { withErrorHandling } from "@/lib/api-handler";

export const POST = withErrorHandling(async (request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.twoFactorEnabled) {
    return NextResponse.json({ error: "Two-factor authentication isn't enabled" }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));

  let confirmed = false;
  if (user.passwordHash) {
    const password = typeof body.password === "string" ? body.password : "";
    confirmed = password.length > 0 && (await bcrypt.compare(password, user.passwordHash));
  } else {
    const token = typeof body.token === "string" ? body.token : "";
    confirmed = user.twoFactorSecret ? await verifyTwoFactorToken(user.twoFactorSecret, token) : false;
  }
  if (!confirmed) {
    return NextResponse.json({ error: "Incorrect password or code" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: false, twoFactorEnabledAt: null, twoFactorSecret: null },
  });

  await logAudit({
    userId: user.id,
    action: "account.2fa-disable",
    targetType: "User",
    targetId: user.id,
    metadata: {},
  });

  return NextResponse.json({ ok: true });
});
