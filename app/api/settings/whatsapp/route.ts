import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { whatsappNumberSchema } from "@/lib/validations/whatsapp";
import { normalizePhone } from "@/lib/phone";
import { withErrorHandling, readJsonBody } from "@/lib/api-handler";

export const PATCH = withErrorHandling(async (request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await readJsonBody(request);
  const parsed = whatsappNumberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  let normalized: string | null = null;
  if (parsed.data.whatsappNumber) {
    normalized = normalizePhone(parsed.data.whatsappNumber);
    if (!normalized) {
      return NextResponse.json({ error: "Enter a valid phone number" }, { status: 400 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { whatsappNumber: normalized },
  });

  return NextResponse.json({ ok: true, whatsappNumber: updated.whatsappNumber });
});
