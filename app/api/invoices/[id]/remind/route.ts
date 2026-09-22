import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageProperty } from "@/lib/authorization";
import { invoiceDisplayStatus } from "@/lib/invoice-status";
import { invoiceTotalDue } from "@/lib/invoice-total";
import { formatMoney } from "@/lib/money";

const COOLDOWN_HOURS = 12;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoice = await prisma.rentInvoice.findUnique({
    where: { id },
    include: {
      payments: true,
      lease: { include: { tenant: true, unit: { include: { property: true } } } },
    },
  });

  if (!invoice || !(await canManageProperty(session.user.id, session.user.role, invoice.lease.unit.propertyId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (invoice.status === "PAID") {
    return NextResponse.json({ error: "This invoice is already fully paid" }, { status: 409 });
  }

  const link = `/tenant/dashboard?invoice=${invoice.id}&kind=manual-reminder`;
  const recent = await prisma.notification.findFirst({
    where: {
      userId: invoice.lease.tenantId,
      link,
      createdAt: { gte: new Date(Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000) },
    },
  });
  if (recent) {
    return NextResponse.json(
      { error: `A reminder was already sent to this tenant recently. Try again later.` },
      { status: 429 }
    );
  }

  const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = invoiceTotalDue(invoice) - paid;
  const status = invoiceDisplayStatus(invoice);
  const property = invoice.lease.unit.property;

  await prisma.notification.create({
    data: {
      userId: invoice.lease.tenantId,
      type: status === "OVERDUE" ? "RENT_OVERDUE" : "RENT_DUE_SOON",
      title: "Rent payment reminder",
      message: `Reminder: ${formatMoney(remaining, invoice.currency)} is ${
        status === "OVERDUE" ? "overdue" : `due ${invoice.dueDate.toLocaleDateString("en-UG")}`
      } for ${property.name} — ${invoice.lease.unit.label}.`,
      link,
    },
  });

  return NextResponse.json({ ok: true });
}
