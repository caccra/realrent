import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { registerSchema } from "@/lib/validations/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ipAllowed = await checkRateLimit(`register:${getClientIp(request)}`, 10, 60);
  if (!ipAllowed) {
    return NextResponse.json({ error: "Too many signups from this network. Try again later." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, phone, email, password, role } = parsed.data;
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return NextResponse.json({ error: "Enter a valid phone number" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this phone number already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      phone: normalizedPhone,
      email: email ? email : null,
      passwordHash,
      role,
    },
  });

  return NextResponse.json({ id: user.id, phone: user.phone, role: user.role });
}
