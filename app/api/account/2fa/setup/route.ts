import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateQrCodeDataUrl, generateTwoFactorSecret } from "@/lib/two-factor";
import { withErrorHandling } from "@/lib/api-handler";

export const POST = withErrorHandling(async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (user.twoFactorEnabled) {
    return NextResponse.json({ error: "Two-factor authentication is already enabled" }, { status: 409 });
  }

  const label = user.phone ?? user.email ?? user.name;
  const { secret, otpauthUrl } = generateTwoFactorSecret(label);
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret } });

  const qrCodeDataUrl = await generateQrCodeDataUrl(otpauthUrl);
  return NextResponse.json({ secret, qrCodeDataUrl });
});
