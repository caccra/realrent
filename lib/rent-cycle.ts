import { prisma } from "@/lib/prisma";
import { nextInvoicePeriod, generateInvoiceNumber } from "@/lib/invoicing";
import { formatMoney } from "@/lib/money";
import { emailLayout, sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import type { Prisma } from "@prisma/client";

const DUE_SOON_DAYS = 3;
const LEASE_EXPIRY_THRESHOLDS = [30, 14, 7];

export async function runRentCycle() {
  const results = {
    invoicesGenerated: 0,
    invoicesMarkedOverdue: 0,
    lateFeesApplied: 0,
    remindersSent: 0,
    leaseExpiryRemindersSent: 0,
  };
  const now = new Date();

  const activeLeases = await prisma.lease.findMany({
    where: { status: "ACTIVE" },
    include: {
      tenant: { select: { email: true, phone: true } },
      unit: { include: { property: true } },
      invoices: { orderBy: { periodEnd: "desc" }, take: 1 },
    },
  });

  for (const lease of activeLeases) {
    const latest = lease.invoices[0];
    if (!latest || latest.status !== "PAID" || latest.periodEnd > now) continue;

    const { periodStart, periodEnd, dueDate } = nextInvoicePeriod(latest.periodEnd, lease.unit.billingCycle);

    const dueRentChange = await prisma.rentChange.findFirst({
      where: { leaseId: lease.id, effectiveDate: { lte: periodStart } },
      orderBy: { effectiveDate: "desc" },
    });
    const amountDue = dueRentChange ? dueRentChange.newRentAmount : lease.rentAmount;

    await prisma.$transaction(async (tx) => {
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

      await sendEmail({
        to: lease.tenant.email,
        subject: "Your rent invoice is ready",
        html: emailLayout(
          "Rent invoice ready",
          `<p>Your rent invoice for <strong>${lease.unit.property.name} — ${lease.unit.label}</strong> is ready:</p>
           <p><strong>${formatMoney(created.amountDue, created.currency)}</strong> due ${created.dueDate.toLocaleDateString("en-UG")}.</p>`,
          `/tenant/invoices/${created.id}`,
          "View invoice"
        ),
      });

      await sendSms({
        to: lease.tenant.phone,
        message: `Kezavi: Rent invoice ready for ${lease.unit.property.name} - ${lease.unit.label}: ${formatMoney(created.amountDue, created.currency)} due ${created.dueDate.toLocaleDateString("en-UG")}.`,
      });
    });
    results.invoicesGenerated += 1;
  }

  const openInvoices = await prisma.rentInvoice.findMany({
    where: { status: { in: ["PENDING", "PARTIAL"] } },
    include: {
      lease: {
        include: {
          tenant: { select: { name: true, email: true, phone: true } },
          unit: {
            include: {
              property: {
                include: {
                  landlord: { select: { email: true, phone: true } },
                  caretakerAssignments: true,
                  propertyManagerAssignments: true,
                },
              },
            },
          },
        },
      },
    },
  });

  for (const inv of openInvoices) {
    const property = inv.lease.unit.property;
    const graceDays = property.lateFeeGraceDays ?? 0;
    const overdueThreshold = new Date(inv.dueDate);
    overdueThreshold.setDate(overdueThreshold.getDate() + graceDays);

    if (now > overdueThreshold) {
      const updates: Prisma.RentInvoiceUpdateInput = {};
      const wasAlreadyOverdue = inv.status === "OVERDUE";
      if (!wasAlreadyOverdue) {
        updates.status = "OVERDUE";
      }

      let appliedFee: number | null = null;
      if (property.lateFeeEnabled && Number(inv.lateFeeAmount) === 0 && property.lateFeeValue != null) {
        appliedFee =
          property.lateFeeType === "PERCENT"
            ? (Number(inv.amountDue) * Number(property.lateFeeValue)) / 100
            : Number(property.lateFeeValue);
        updates.lateFeeAmount = appliedFee;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.rentInvoice.update({ where: { id: inv.id }, data: updates });
        if (appliedFee != null) results.lateFeesApplied += 1;

        if (!wasAlreadyOverdue) {
          results.invoicesMarkedOverdue += 1;

          const tenantLink = `/tenant/dashboard?invoice=${inv.id}&kind=overdue`;
          const tenantMessage =
            appliedFee != null
              ? `Your rent for ${property.name} — ${inv.lease.unit.label} is overdue. A late fee of ${formatMoney(
                  appliedFee,
                  inv.currency
                )} has been applied.`
              : `Your rent for ${property.name} — ${inv.lease.unit.label} is overdue.`;
          await prisma.notification.create({
            data: {
              userId: inv.lease.tenantId,
              type: "RENT_OVERDUE",
              title: "Rent overdue",
              message: tenantMessage,
              link: tenantLink,
            },
          });

          await sendEmail({
            to: inv.lease.tenant.email,
            subject: "Your rent is overdue",
            html: emailLayout("Rent overdue", `<p>${tenantMessage}</p>`, tenantLink, "View invoice"),
          });

          await sendSms({ to: inv.lease.tenant.phone, message: `Kezavi: ${tenantMessage}` });

          const landlordLink = `/landlord/leases/${inv.leaseId}`;
          const caretakerLink = `/caretaker/leases/${inv.leaseId}`;
          const managerMessage = `${inv.lease.tenant.name} hasn't paid rent for ${property.name} — ${inv.lease.unit.label}. Now overdue.`;

          await sendEmail({
            to: property.landlord.email,
            subject: "Tenant rent overdue",
            html: emailLayout("Tenant rent overdue", `<p>${managerMessage}</p>`, landlordLink, "View lease"),
          });

          await sendSms({ to: property.landlord.phone, message: `Kezavi: ${managerMessage}` });

          await prisma.notification.createMany({
            data: [
              {
                userId: property.landlordId,
                type: "RENT_OVERDUE",
                title: "Tenant rent overdue",
                message: managerMessage,
                link: landlordLink,
              },
              ...property.propertyManagerAssignments.map((a) => ({
                userId: a.managerId,
                type: "RENT_OVERDUE" as const,
                title: "Tenant rent overdue",
                message: managerMessage,
                link: landlordLink,
              })),
              ...property.caretakerAssignments.map((a) => ({
                userId: a.caretakerId,
                type: "RENT_OVERDUE" as const,
                title: "Tenant rent overdue",
                message: managerMessage,
                link: caretakerLink,
              })),
            ],
          });

          results.remindersSent +=
            2 + property.propertyManagerAssignments.length + property.caretakerAssignments.length;
        }
      }
      continue;
    }

    const daysUntilDue = Math.ceil((inv.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue < 0 || daysUntilDue > DUE_SOON_DAYS) continue;

    const link = `/tenant/dashboard?invoice=${inv.id}&kind=due-soon`;
    const existing = await prisma.notification.findFirst({
      where: { userId: inv.lease.tenantId, type: "RENT_DUE_SOON", link },
    });
    if (existing) continue;

    const dueSoonMessage = `Rent of ${formatMoney(inv.amountDue, inv.currency)} for ${property.name} — ${inv.lease.unit.label} is due ${inv.dueDate.toLocaleDateString(
      "en-UG"
    )}.`;

    await prisma.notification.create({
      data: {
        userId: inv.lease.tenantId,
        type: "RENT_DUE_SOON",
        title: "Rent due soon",
        message: dueSoonMessage,
        link,
      },
    });

    await sendEmail({
      to: inv.lease.tenant.email,
      subject: "Rent due soon",
      html: emailLayout("Rent due soon", `<p>${dueSoonMessage}</p>`, `/tenant/invoices/${inv.id}`, "View invoice"),
    });

    await sendSms({ to: inv.lease.tenant.phone, message: `Kezavi: ${dueSoonMessage}` });

    results.remindersSent += 1;
  }

  const expiringLeases = await prisma.lease.findMany({
    where: { status: "ACTIVE", endDate: { not: null } },
    include: {
      tenant: { select: { name: true, email: true, phone: true } },
      unit: {
        include: {
          property: {
            include: {
              landlord: { select: { email: true, phone: true } },
              caretakerAssignments: true,
              propertyManagerAssignments: true,
            },
          },
        },
      },
    },
  });

  for (const lease of expiringLeases) {
    if (!lease.endDate) continue;
    const daysUntilEnd = Math.ceil((lease.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const property = lease.unit.property;

    for (const threshold of LEASE_EXPIRY_THRESHOLDS) {
      if (daysUntilEnd < 0 || daysUntilEnd > threshold) continue;

      const landlordLink = `/landlord/leases/${lease.id}?kind=lease-expiring-${threshold}`;
      const existing = await prisma.notification.findFirst({
        where: { userId: property.landlordId, type: "LEASE_EXPIRING", link: landlordLink },
      });
      if (existing) continue;

      const endDateLabel = lease.endDate.toLocaleDateString("en-UG");
      const managerMessage = `${lease.tenant.name}'s lease for ${property.name} — ${lease.unit.label} expires in ${daysUntilEnd} day${daysUntilEnd === 1 ? "" : "s"} (${endDateLabel}).`;
      const caretakerLink = `/caretaker/leases/${lease.id}`;
      const tenantMessage = `Your lease for ${property.name} — ${lease.unit.label} ends on ${endDateLabel}.`;

      await sendEmail({
        to: property.landlord.email,
        subject: "Lease expiring soon",
        html: emailLayout("Lease expiring soon", `<p>${managerMessage}</p>`, landlordLink, "View lease"),
      });

      await sendSms({ to: property.landlord.phone, message: `Kezavi: ${managerMessage}` });

      await sendEmail({
        to: lease.tenant.email,
        subject: "Your lease is ending soon",
        html: emailLayout(
          "Your lease is ending soon",
          `<p>${tenantMessage}</p>`,
          `/tenant/dashboard?lease=${lease.id}&kind=lease-expiring`,
          "View lease"
        ),
      });

      await sendSms({ to: lease.tenant.phone, message: `Kezavi: ${tenantMessage}` });

      await prisma.notification.createMany({
        data: [
          {
            userId: property.landlordId,
            type: "LEASE_EXPIRING",
            title: "Lease expiring soon",
            message: managerMessage,
            link: landlordLink,
          },
          ...property.propertyManagerAssignments.map((a) => ({
            userId: a.managerId,
            type: "LEASE_EXPIRING" as const,
            title: "Lease expiring soon",
            message: managerMessage,
            link: landlordLink,
          })),
          ...property.caretakerAssignments.map((a) => ({
            userId: a.caretakerId,
            type: "LEASE_EXPIRING" as const,
            title: "Lease expiring soon",
            message: managerMessage,
            link: caretakerLink,
          })),
          {
            userId: lease.tenantId,
            type: "LEASE_EXPIRING",
            title: "Your lease is ending soon",
            message: tenantMessage,
            link: `/tenant/dashboard?lease=${lease.id}&kind=lease-expiring`,
          },
        ],
      });

      results.leaseExpiryRemindersSent +=
        2 + property.propertyManagerAssignments.length + property.caretakerAssignments.length;
    }
  }

  return results;
}
