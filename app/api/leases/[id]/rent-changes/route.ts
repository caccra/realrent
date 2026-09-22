import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rentChangeSchema } from "@/lib/validations/rent-change";
import { canManageProperty } from "@/lib/authorization";
import { formatMoney } from "@/lib/money";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lease = await prisma.lease.findUnique({
    where: { id },
    include: { unit: { include: { property: true } } },
  });
  if (!lease || !(await canManageProperty(session.user.id, session.user.role, lease.unit.propertyId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (lease.status !== "ACTIVE") {
    return NextResponse.json({ error: "This lease has already ended" }, { status: 409 });
  }

  const body = await request.json();
  const parsed = rentChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const effectiveDate = new Date(parsed.data.effectiveDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (effectiveDate < today) {
    return NextResponse.json({ error: "Effective date can't be in the past" }, { status: 400 });
  }

  const rentChange = await prisma.rentChange.create({
    data: {
      leaseId: lease.id,
      newRentAmount: parsed.data.newRentAmount,
      effectiveDate,
      note: parsed.data.note || null,
    },
  });

  await prisma.notification.create({
    data: {
      userId: lease.tenantId,
      type: "RENT_INCREASE",
      title: "Rent change scheduled",
      message: `Rent for ${lease.unit.property.name} — ${lease.unit.label} will change to ${formatMoney(
        parsed.data.newRentAmount,
        lease.currency
      )} starting ${effectiveDate.toLocaleDateString("en-UG")}`,
      link: "/tenant/dashboard",
    },
  });

  return NextResponse.json(rentChange);
}
