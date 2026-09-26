import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { leaseSchema } from "@/lib/validations/property";
import { findOrCreateUserByPhone } from "@/lib/user-provisioning";
import { firstInvoicePeriod, generateInvoiceNumber } from "@/lib/invoicing";
import { canManageProperty } from "@/lib/authorization";
import { formatMoney } from "@/lib/money";
import { emailLayout, sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { withErrorHandling, readJsonBody } from "@/lib/api-handler";

export const POST = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const unit = await prisma.unit.findUnique({ where: { id }, include: { property: true } });
  if (!unit || !(await canManageProperty(session.user.id, session.user.role, unit.propertyId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (unit.status === "OCCUPIED") {
    return NextResponse.json({ error: "This unit already has an active lease" }, { status: 409 });
  }

  const body = await readJsonBody(request);
  const parsed = leaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const provisioned = await findOrCreateUserByPhone(parsed.data.tenantPhone, parsed.data.tenantName, "TENANT");
  if (!provisioned.ok) {
    return NextResponse.json({ error: provisioned.error }, { status: 409 });
  }
  const tenant = provisioned.user;

  const startDate = new Date(parsed.data.startDate);
  const { periodStart, periodEnd, dueDate } = firstInvoicePeriod(startDate, unit.billingCycle);

  const lease = await prisma.$transaction(async (tx) => {
    const created = await tx.lease.create({
      data: {
        unitId: unit.id,
        tenantId: tenant.id,
        startDate,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        rentAmount: parsed.data.rentAmount,
        depositAmount: parsed.data.depositAmount,
        currency: unit.currency,
        status: "ACTIVE",
      },
    });

    await tx.unit.update({ where: { id: unit.id }, data: { status: "OCCUPIED" } });

    const invoice = await tx.rentInvoice.create({
      data: {
        leaseId: created.id,
        invoiceNumber: generateInvoiceNumber(),
        periodStart,
        periodEnd,
        dueDate,
        amountDue: parsed.data.rentAmount,
        currency: unit.currency,
      },
    });

    await tx.notification.create({
      data: {
        userId: tenant.id,
        type: "INVOICE_GENERATED",
        title: "Rent invoice ready",
        message: `Your rent invoice for ${unit.property.name} — ${unit.label} is ready: ${formatMoney(
          invoice.amountDue,
          invoice.currency
        )} due ${invoice.dueDate.toLocaleDateString("en-UG")}.`,
        link: `/tenant/invoices/${invoice.id}`,
      },
    });

    return created;
  });

  const invoice = await prisma.rentInvoice.findFirst({ where: { leaseId: lease.id }, orderBy: { createdAt: "desc" } });
  if (invoice) {
    await sendEmail({
      to: tenant.email,
      subject: "Your rent invoice is ready",
      html: emailLayout(
        "Rent invoice ready",
        `<p>Your rent invoice for <strong>${unit.property.name} — ${unit.label}</strong> is ready:</p>
         <p><strong>${formatMoney(invoice.amountDue, invoice.currency)}</strong> due ${invoice.dueDate.toLocaleDateString("en-UG")}.</p>`,
        `/tenant/invoices/${invoice.id}`,
        "View invoice"
      ),
    });

    await sendSms({
      to: tenant.phone,
      message: `Kezavi: Rent invoice ready for ${unit.property.name} - ${unit.label}: ${formatMoney(invoice.amountDue, invoice.currency)} due ${invoice.dueDate.toLocaleDateString("en-UG")}.`,
    });
  }

  return NextResponse.json({
    id: lease.id,
    tenantPhone: tenant.phone,
    tempPassword: provisioned.tempPassword,
  });
});
