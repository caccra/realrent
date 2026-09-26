import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cashPaymentSchema } from "@/lib/validations/property";
import { generateReceiptNumber } from "@/lib/invoicing";
import { canManageProperty } from "@/lib/authorization";
import { invoiceTotalDue } from "@/lib/invoice-total";
import { logAudit } from "@/lib/audit-log";
import { emailLayout, sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { formatMoney } from "@/lib/money";
import { withErrorHandling, readJsonBody } from "@/lib/api-handler";

export const POST = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoice = await prisma.rentInvoice.findUnique({
    where: { id },
    include: {
      lease: { include: { tenant: true, unit: { include: { property: true } } } },
      payments: true,
    },
  });

  if (!invoice || !(await canManageProperty(session.user.id, session.user.role, invoice.lease.unit.propertyId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (invoice.status === "PAID") {
    return NextResponse.json({ error: "This invoice is already fully paid" }, { status: 409 });
  }

  const body = await readJsonBody(request);
  const parsed = cashPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const alreadyPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const newTotal = alreadyPaid + parsed.data.amount;
  const amountDue = invoiceTotalDue(invoice);

  if (newTotal > amountDue) {
    return NextResponse.json(
      { error: `Amount exceeds the remaining balance of ${amountDue - alreadyPaid}` },
      { status: 400 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: parsed.data.amount,
        method: "CASH",
        status: "SUCCESSFUL",
        currency: invoice.currency,
      },
    });

    const receipt = await tx.receipt.create({
      data: {
        paymentId: payment.id,
        receiptNumber: generateReceiptNumber(),
      },
    });

    await tx.rentInvoice.update({
      where: { id: invoice.id },
      data: { status: newTotal >= amountDue ? "PAID" : "PARTIAL" },
    });

    return { payment, receipt };
  });

  await logAudit({
    userId: session.user.id,
    action: "payment.record-cash",
    targetType: "Payment",
    targetId: result.payment.id,
    metadata: { invoiceId: invoice.id, amount: parsed.data.amount },
  });

  await sendEmail({
    to: invoice.lease.tenant.email,
    subject: "Payment received — receipt attached",
    html: emailLayout(
      "Payment received",
      `<p>We've recorded your payment of <strong>${formatMoney(parsed.data.amount, invoice.currency)}</strong> for
       ${invoice.lease.unit.property.name} — ${invoice.lease.unit.label}.</p>
       <p>Receipt number: <strong>${result.receipt.receiptNumber}</strong></p>`,
      `/tenant/receipts/${result.receipt.id}`,
      "View receipt"
    ),
  });

  await sendSms({
    to: invoice.lease.tenant.phone,
    message: `Kezavi: Payment of ${formatMoney(parsed.data.amount, invoice.currency)} received for ${invoice.lease.unit.property.name} - ${invoice.lease.unit.label}. Receipt: ${result.receipt.receiptNumber}.`,
  });

  return NextResponse.json(result);
});
