import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { generateResetToken } from "@/lib/tokens";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { withErrorHandling, readJsonBody } from "@/lib/api-handler";

const TOKEN_TTL_MINUTES = 30;

export const POST = withErrorHandling(async (request) => {
  const ipAllowed = await checkRateLimit(`forgot-password-ip:${getClientIp(request)}`, 10, 60);
  if (!ipAllowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const body = await readJsonBody(request);
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const normalizedPhone = normalizePhone(parsed.data.phone);
  if (!normalizedPhone) {
    return NextResponse.json({ error: "Enter a valid phone number" }, { status: 400 });
  }

  const phoneAllowed = await checkRateLimit(`forgot-password:${normalizedPhone}`, 3, 15);
  if (!phoneAllowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { phone: normalizedPhone } });

  const response: { message: string; devResetUrl?: string } = {
    message: "If an account exists for that number, a reset link has been generated.",
  };

  if (user) {
    const { token, tokenHash } = generateResetToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000),
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // No SMS/email provider is wired up yet — log it server-side so it can still be tested end to end.
    console.log(`[password reset] ${normalizedPhone} -> ${resetUrl}`);

    if (process.env.NODE_ENV !== "production") {
      response.devResetUrl = resetUrl;
    }
  }

  return NextResponse.json(response);
});
