import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nextInvoicePeriod } from "@/lib/invoicing";
import { canManageProperty } from "@/lib/authorization";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lease = await prisma.lease.findUnique({
    where: { id },
    include: {
      unit: { include: { property: true } },
      invoices: { orderBy: { periodEnd: "desc" }, take: 1 },
    },
  });

  if (!lease || !(await canManageProperty(session.user.id, session.user.role, lease.unit.propertyId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const latest = lease.invoices[0];
  if (!latest) {
    return NextResponse.json({ error: "Lease has no invoices yet" }, { status: 409 });
  }
  if (latest.status !== "PAID") {
    return NextResponse.json(
      { error: "The most recent invoice hasn't been paid yet" },
      { status: 409 }
    );
  }

  const { periodStart, periodEnd, dueDate } = nextInvoicePeriod(latest.periodEnd, lease.unit.billingCycle);

  // Apply the most recent scheduled rent change that has taken effect by this period.
  const dueRentChange = await prisma.rentChange.findFirst({
    where: { leaseId: lease.id, effectiveDate: { lte: periodStart } },
    orderBy: { effectiveDate: "desc" },
  });
  const amountDue = dueRentChange ? dueRentChange.newRentAmount : lease.rentAmount;

  const [invoice] = await prisma.$transaction([
    prisma.rentInvoice.create({
      data: { leaseId: lease.id, periodStart, periodEnd, dueDate, amountDue, currency: lease.currency },
    }),
    ...(dueRentChange && Number(dueRentChange.newRentAmount) !== Number(lease.rentAmount)
      ? [prisma.lease.update({ where: { id: lease.id }, data: { rentAmount: dueRentChange.newRentAmount } })]
      : []),
  ]);

  return NextResponse.json(invoice);
}
