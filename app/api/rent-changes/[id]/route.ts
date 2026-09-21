import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageProperty } from "@/lib/authorization";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rentChange = await prisma.rentChange.findUnique({
    where: { id },
    include: { lease: { include: { unit: true } } },
  });
  if (
    !rentChange ||
    !(await canManageProperty(session.user.id, session.user.role, rentChange.lease.unit.propertyId))
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.rentChange.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
