import { prisma } from "@/lib/prisma";
import { nextInvoicePeriod } from "@/lib/invoicing";
import { formatMoney } from "@/lib/money";
import type { Prisma } from "@prisma/client";

const DUE_SOON_DAYS = 3;

export async function runRentCycle() {
  const results = { invoicesGenerated: 0, invoicesMarkedOverdue: 0, lateFeesApplied: 0, remindersSent: 0 };
  const now = new Date();

  const activeLeases = await prisma.lease.findMany({
    where: { status: "ACTIVE" },
    include: {
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

    await prisma.$transaction([
      prisma.rentInvoice.create({
        data: { leaseId: lease.id, periodStart, periodEnd, dueDate, amountDue, currency: lease.currency },
      }),
      ...(dueRentChange && Number(dueRentChange.newRentAmount) !== Number(lease.rentAmount)
        ? [prisma.lease.update({ where: { id: lease.id }, data: { rentAmount: dueRentChange.newRentAmount } })]
        : []),
    ]);
    results.invoicesGenerated += 1;
  }

  const openInvoices = await prisma.rentInvoice.findMany({
    where: { status: { in: ["PENDING", "PARTIAL"] } },
    include: {
      lease: {
        include: {
          tenant: { select: { name: true } },
          unit: { include: { property: { include: { caretakerAssignments: true } } } },
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
          await prisma.notification.create({
            data: {
              userId: inv.lease.tenantId,
              type: "RENT_OVERDUE",
              title: "Rent overdue",
              message:
                appliedFee != null
                  ? `Your rent for ${property.name} — ${inv.lease.unit.label} is overdue. A late fee of ${formatMoney(
                      appliedFee,
                      inv.currency
                    )} has been applied.`
                  : `Your rent for ${property.name} — ${inv.lease.unit.label} is overdue.`,
              link: tenantLink,
            },
          });

          const landlordLink = `/landlord/leases/${inv.leaseId}`;
          const caretakerLink = `/caretaker/leases/${inv.leaseId}`;
          const managerMessage = `${inv.lease.tenant.name} hasn't paid rent for ${property.name} — ${inv.lease.unit.label}. Now overdue.`;
          await prisma.notification.createMany({
            data: [
              {
                userId: property.landlordId,
                type: "RENT_OVERDUE",
                title: "Tenant rent overdue",
                message: managerMessage,
                link: landlordLink,
              },
              ...property.caretakerAssignments.map((a) => ({
                userId: a.caretakerId,
                type: "RENT_OVERDUE" as const,
                title: "Tenant rent overdue",
                message: managerMessage,
                link: caretakerLink,
              })),
            ],
          });

          results.remindersSent += 2 + property.caretakerAssignments.length;
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

    await prisma.notification.create({
      data: {
        userId: inv.lease.tenantId,
        type: "RENT_DUE_SOON",
        title: "Rent due soon",
        message: `Rent of ${formatMoney(inv.amountDue, inv.currency)} for ${property.name} — ${inv.lease.unit.label} is due ${inv.dueDate.toLocaleDateString(
          "en-UG"
        )}.`,
        link,
      },
    });
    results.remindersSent += 1;
  }

  return results;
}
