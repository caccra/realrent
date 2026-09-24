import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lateFeePolicySchema } from "@/lib/validations/late-fee";
import { canManageProperty } from "@/lib/authorization";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property || !(await canManageProperty(session.user.id, session.user.role, id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = lateFeePolicySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const updated = await prisma.property.update({
    where: { id },
    data: {
      lateFeeEnabled: parsed.data.lateFeeEnabled,
      lateFeeType: parsed.data.lateFeeEnabled ? parsed.data.lateFeeType || null : null,
      lateFeeValue: parsed.data.lateFeeEnabled ? parsed.data.lateFeeValue ?? null : null,
      lateFeeGraceDays: parsed.data.lateFeeEnabled ? parsed.data.lateFeeGraceDays ?? 0 : null,
    },
  });

  return NextResponse.json(updated);
}
