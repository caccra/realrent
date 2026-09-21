import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { endLeaseSchema } from "@/lib/validations/lease";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "LANDLORD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  const lease = await prisma.lease.findUnique({
    where: { id },
    include: { unit: { include: { property: true } } },
  });
  if (!lease || lease.unit.property.landlordId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.action === "end") {
    if (lease.status !== "ACTIVE") {
      return NextResponse.json({ error: "This lease has already ended" }, { status: 409 });
    }

    const parsed = endLeaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const deductions = parsed.data.depositDeductions ?? 0;
    const refundAmount = Math.max(Number(lease.depositAmount) - deductions, 0);

    await prisma.$transaction([
      prisma.lease.update({
        where: { id: lease.id },
        data: {
          status: "ENDED",
          endDate: new Date(),
          depositDeductions: deductions,
          depositDeductionNote: parsed.data.depositDeductionNote || null,
          depositRefundAmount: refundAmount,
          depositRefundedAt: parsed.data.markRefunded ? new Date() : null,
        },
      }),
      prisma.unit.update({ where: { id: lease.unitId }, data: { status: "VACANT" } }),
    ]);

    return NextResponse.json({ ok: true });
  }

  if (body.action === "mark-refunded") {
    if (lease.status === "ACTIVE") {
      return NextResponse.json({ error: "End the lease before recording a deposit refund" }, { status: 409 });
    }
    if (lease.depositRefundAmount == null) {
      return NextResponse.json({ error: "No refund amount was recorded for this lease" }, { status: 409 });
    }
    if (lease.depositRefundedAt) {
      return NextResponse.json({ error: "This deposit was already marked refunded" }, { status: 409 });
    }

    await prisma.lease.update({ where: { id: lease.id }, data: { depositRefundedAt: new Date() } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
