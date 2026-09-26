import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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
  if (!user?.twoFactorSecret) {
    return NextResponse.json({ error: "Start setup before confirming a code" }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token : "";
  const valid = await verifyTwoFactorToken(user.twoFactorSecret, token);
  if (!valid) {
    return NextResponse.json({ error: "That code didn't match. Try again." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true, twoFactorEnabledAt: new Date() },
  });

  await logAudit({
    userId: user.id,
    action: "account.2fa-enable",
    targetType: "User",
    targetId: user.id,
    metadata: {},
  });

  return NextResponse.json({ ok: true });
});
