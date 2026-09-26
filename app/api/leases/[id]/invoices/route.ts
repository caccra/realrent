import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nextInvoicePeriod, generateInvoiceNumber } from "@/lib/invoicing";
import { canManageProperty } from "@/lib/authorization";
import { formatMoney } from "@/lib/money";
import { emailLayout, sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { withErrorHandling } from "@/lib/api-handler";

export const POST = withErrorHandling(async (_request, { params }) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lease = await prisma.lease.findUnique({
    where: { id },
    include: {
      tenant: true,
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

  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.rentInvoice.create({
      data: {
        leaseId: lease.id,
        invoiceNumber: generateInvoiceNumber(),
        periodStart,
        periodEnd,
        dueDate,
        amountDue,
        currency: lease.currency,
      },
    });

    if (dueRentChange && Number(dueRentChange.newRentAmount) !== Number(lease.rentAmount)) {
      await tx.lease.update({ where: { id: lease.id }, data: { rentAmount: dueRentChange.newRentAmount } });
    }

    await tx.notification.create({
      data: {
        userId: lease.tenantId,
        type: "INVOICE_GENERATED",
        title: "Rent invoice ready",
        message: `Your rent invoice for ${lease.unit.property.name} — ${lease.unit.label} is ready: ${formatMoney(
          created.amountDue,
          created.currency
        )} due ${created.dueDate.toLocaleDateString("en-UG")}.`,
        link: `/tenant/invoices/${created.id}`,
      },
    });

    return created;
  });

  await sendEmail({
    to: lease.tenant.email,
    subject: "Your rent invoice is ready",
    html: emailLayout(
      "Rent invoice ready",
      `<p>Your rent invoice for <strong>${lease.unit.property.name} — ${lease.unit.label}</strong> is ready:</p>
       <p><strong>${formatMoney(invoice.amountDue, invoice.currency)}</strong> due ${invoice.dueDate.toLocaleDateString("en-UG")}.</p>`,
      `/tenant/invoices/${invoice.id}`,
      "View invoice"
    ),
  });

  await sendSms({
    to: lease.tenant.phone,
    message: `Kezavi: Rent invoice ready for ${lease.unit.property.name} - ${lease.unit.label}: ${formatMoney(invoice.amountDue, invoice.currency)} due ${invoice.dueDate.toLocaleDateString("en-UG")}.`,
  });

  return NextResponse.json(invoice);
});
