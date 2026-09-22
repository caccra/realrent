import { prisma } from "@/lib/prisma";
import type { Prisma, PropertyListingType, PropertyType, PropertyUsage } from "@prisma/client";
import { invoiceTotalDue } from "@/lib/invoice-total";

export type PublicPropertyFilters = {
  listingType?: PropertyListingType;
  usage?: PropertyUsage;
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  q?: string;
};

export function getPublicProperties(filters: PublicPropertyFilters = {}) {
  const unitWhere: Prisma.UnitWhereInput = { status: "VACANT" };
  if (filters.minPrice != null || filters.maxPrice != null) {
    unitWhere.rentAmount = {
      ...(filters.minPrice != null ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice != null ? { lte: filters.maxPrice } : {}),
    };
  }
  if (filters.bedrooms != null) {
    unitWhere.bedrooms = { gte: filters.bedrooms };
  }

  const rentalCondition: Prisma.PropertyWhereInput = { listingType: "RENTAL", units: { some: unitWhere } };

  const saleCondition: Prisma.PropertyWhereInput = { listingType: "SALE" };
  if (filters.minPrice != null || filters.maxPrice != null) {
    saleCondition.salePrice = {
      ...(filters.minPrice != null ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice != null ? { lte: filters.maxPrice } : {}),
    };
  }
  if (filters.bedrooms != null) {
    saleCondition.saleBedrooms = { gte: filters.bedrooms };
  }

  const listingCondition: Prisma.PropertyWhereInput =
    filters.listingType === "RENTAL"
      ? rentalCondition
      : filters.listingType === "SALE"
        ? saleCondition
        : { OR: [rentalCondition, saleCondition] };

  const and: Prisma.PropertyWhereInput[] = [listingCondition];
  if (filters.usage) and.push({ usage: filters.usage });
  if (filters.propertyType) and.push({ propertyType: filters.propertyType });
  if (filters.q) {
    const q = filters.q;
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  return prisma.property.findMany({
    where: { AND: and },
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: [{ featured: "desc" }, { order: "asc" }], take: 1 },
      units: { where: unitWhere, orderBy: { rentAmount: "asc" } },
    },
  });
}

export async function getPropertyReviewSummaries(propertyIds: string[]) {
  if (propertyIds.length === 0) return new Map<string, { average: number; count: number }>();

  const groups = await prisma.review.groupBy({
    by: ["propertyId"],
    where: { propertyId: { in: propertyIds }, direction: "TENANT_TO_LANDLORD" },
    _avg: { rating: true },
    _count: true,
  });

  const map = new Map<string, { average: number; count: number }>();
  for (const g of groups) {
    if (!g.propertyId) continue;
    map.set(g.propertyId, { average: g._avg.rating ?? 0, count: g._count });
  }
  return map;
}

export function getUserAuditLogs(userId: string) {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export function getPropertyInquiries(propertyId: string) {
  return prisma.propertyInquiry.findMany({
    where: { propertyId },
    orderBy: { createdAt: "desc" },
  });
}

export function incrementPropertyView(propertyId: string) {
  return prisma.property.update({
    where: { id: propertyId },
    data: { viewCount: { increment: 1 } },
    select: { viewCount: true },
  });
}

export function getPublicPropertyDetail(propertyId: string) {
  return prisma.property.findFirst({
    where: {
      id: propertyId,
      OR: [{ listingType: "RENTAL", units: { some: { status: "VACANT" } } }, { listingType: "SALE" }],
    },
    include: {
      images: { orderBy: [{ featured: "desc" }, { order: "asc" }] },
      units: { where: { status: "VACANT" }, orderBy: { rentAmount: "asc" } },
      landlord: {
        select: {
          name: true,
          acceptsCash: true,
          acceptsMobileMoney: true,
          momoProvider: true,
          momoNumber: true,
          acceptsBankTransfer: true,
          bankName: true,
          bankAccountName: true,
          bankAccountNumber: true,
        },
      },
    },
  });
}

export function getLandlordProperties(landlordId: string) {
  return prisma.property.findMany({
    where: { landlordId },
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: [{ featured: "desc" }, { order: "asc" }], take: 1 },
      units: {
        orderBy: { label: "asc" },
        include: {
          leases: {
            where: { status: "ACTIVE" },
            include: { tenant: true },
            take: 1,
          },
        },
      },
    },
  });
}

export function getLandlordInvoices(landlordId: string) {
  return prisma.rentInvoice.findMany({
    where: { lease: { unit: { property: { landlordId } } } },
    orderBy: { dueDate: "asc" },
    include: {
      lease: {
        include: {
          tenant: true,
          unit: { include: { property: true } },
        },
      },
      payments: true,
    },
  });
}

export async function getLandlordFinancialSummary(landlordId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [monthAgg, yearAgg] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        status: "SUCCESSFUL",
        paidAt: { gte: startOfMonth },
        invoice: { lease: { unit: { property: { landlordId } } } },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        status: "SUCCESSFUL",
        paidAt: { gte: startOfYear },
        invoice: { lease: { unit: { property: { landlordId } } } },
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    collectedThisMonth: Number(monthAgg._sum.amount ?? 0),
    collectedThisYear: Number(yearAgg._sum.amount ?? 0),
  };
}

export function getLandlordTenants(landlordId: string) {
  return prisma.lease.findMany({
    where: { unit: { property: { landlordId } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      tenant: true,
      unit: { include: { property: true } },
      invoices: { include: { payments: true } },
    },
  });
}

export function getLandlordPayments(landlordId: string) {
  return prisma.payment.findMany({
    where: { invoice: { lease: { unit: { property: { landlordId } } } } },
    orderBy: { paidAt: "desc" },
    include: {
      receipt: true,
      invoice: { include: { lease: { include: { tenant: true, unit: { include: { property: true } } } } } },
    },
  });
}

export function getCaretakerPayments(caretakerId: string) {
  return prisma.payment.findMany({
    where: {
      invoice: { lease: { unit: { property: { caretakerAssignments: { some: { caretakerId } } } } } },
    },
    orderBy: { paidAt: "desc" },
    include: {
      receipt: true,
      invoice: { include: { lease: { include: { tenant: true, unit: { include: { property: true } } } } } },
    },
  });
}

export function getCaretakerTenants(caretakerId: string) {
  return prisma.lease.findMany({
    where: { unit: { property: { caretakerAssignments: { some: { caretakerId } } } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      tenant: true,
      unit: { include: { property: true } },
      invoices: { include: { payments: true } },
    },
  });
}

export async function getPropertyMonthlyStatement(propertyId: string, year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return null;

  const invoices = await prisma.rentInvoice.findMany({
    where: { lease: { unit: { propertyId } }, dueDate: { gte: start, lt: end } },
    include: { payments: true, lease: { include: { tenant: true, unit: true } } },
  });

  const expectedRent = invoices.reduce((sum, inv) => sum + invoiceTotalDue(inv), 0);

  const payments = await prisma.payment.findMany({
    where: {
      status: "SUCCESSFUL",
      paidAt: { gte: start, lt: end },
      invoice: { lease: { unit: { propertyId } } },
    },
    include: { invoice: { include: { lease: { include: { tenant: true, unit: true } } } } },
  });
  const collected = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  const maintenance = await prisma.maintenanceRequest.findMany({
    where: {
      propertyId,
      status: "COMPLETED",
      completedAt: { gte: start, lt: end },
      cost: { not: null },
    },
  });
  const maintenanceCost = maintenance.reduce((sum, m) => sum + Number(m.cost ?? 0), 0);

  return {
    property,
    periodStart: start,
    periodEnd: end,
    expectedRent,
    collected,
    outstanding: Math.max(expectedRent - collected, 0),
    maintenanceCost,
    netIncome: collected - maintenanceCost,
    invoices,
    payments,
    maintenance,
  };
}

export async function getLandlordAnalytics(landlordId: string) {
  const units = await prisma.unit.findMany({
    where: { property: { landlordId } },
    select: { id: true, status: true, propertyId: true, property: { select: { name: true } } },
  });

  const totalUnits = units.length;
  const occupiedUnits = units.filter((u) => u.status === "OCCUPIED").length;
  const occupancyRate = totalUnits > 0 ? occupiedUnits / totalUnits : 0;

  const byPropertyMap = new Map<string, { id: string; name: string; total: number; occupied: number }>();
  for (const u of units) {
    const entry = byPropertyMap.get(u.propertyId) ?? {
      id: u.propertyId,
      name: u.property.name,
      total: 0,
      occupied: 0,
    };
    entry.total += 1;
    if (u.status === "OCCUPIED") entry.occupied += 1;
    byPropertyMap.set(u.propertyId, entry);
  }

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const offset = 5 - i;
    const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);
    return { label: start.toLocaleDateString("en-UG", { month: "short", year: "2-digit" }), start, end };
  });

  const payments = await prisma.payment.findMany({
    where: {
      status: "SUCCESSFUL",
      paidAt: { gte: months[0].start },
      invoice: { lease: { unit: { property: { landlordId } } } },
    },
    select: { amount: true, paidAt: true, method: true },
  });

  const byMethodMap = new Map<string, number>();
  for (const p of payments) {
    byMethodMap.set(p.method, (byMethodMap.get(p.method) ?? 0) + Number(p.amount));
  }
  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const byMethod = Array.from(byMethodMap.entries())
    .map(([method, amount]) => ({ method, amount, share: totalCollected > 0 ? amount / totalCollected : 0 }))
    .sort((a, b) => b.amount - a.amount);

  const trend = months.map(({ label, start, end }) => ({
    label,
    amount: payments
      .filter((p) => p.paidAt >= start && p.paidAt < end)
      .reduce((sum, p) => sum + Number(p.amount), 0),
  }));

  const openInvoices = await prisma.rentInvoice.findMany({
    where: { status: { not: "PAID" }, lease: { unit: { property: { landlordId } } } },
    include: {
      payments: true,
      lease: { include: { tenant: true, unit: { include: { property: true } } } },
    },
    orderBy: { dueDate: "asc" },
  });

  let totalArrears = 0;
  const arrearsByTenant = new Map<
    string,
    { tenantId: string; tenantName: string; propertyLabel: string; amount: number; oldestDueDate: Date }
  >();
  for (const inv of openInvoices) {
    const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = invoiceTotalDue(inv) - paid;
    if (remaining <= 0) continue;
    totalArrears += remaining;
    const key = inv.lease.tenantId;
    const entry = arrearsByTenant.get(key) ?? {
      tenantId: inv.lease.tenantId,
      tenantName: inv.lease.tenant.name,
      propertyLabel: `${inv.lease.unit.property.name} — ${inv.lease.unit.label}`,
      amount: 0,
      oldestDueDate: inv.dueDate,
    };
    entry.amount += remaining;
    if (inv.dueDate < entry.oldestDueDate) entry.oldestDueDate = inv.dueDate;
    arrearsByTenant.set(key, entry);
  }

  return {
    totalUnits,
    occupiedUnits,
    occupancyRate,
    byProperty: Array.from(byPropertyMap.values()),
    trend,
    byMethod,
    totalArrears,
    arrears: Array.from(arrearsByTenant.values()).sort((a, b) => b.amount - a.amount),
  };
}

export function getLandlordMaintenanceRequests(landlordId: string) {
  return prisma.maintenanceRequest.findMany({
    where: { property: { landlordId } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { property: true, unit: true, createdBy: { select: { name: true } } },
  });
}

export function getCaretakerMaintenanceRequests(caretakerId: string) {
  return prisma.maintenanceRequest.findMany({
    where: { property: { caretakerAssignments: { some: { caretakerId } } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { property: true, unit: true, createdBy: { select: { name: true } } },
  });
}

export function getPropertyCaretakers(propertyId: string) {
  return prisma.caretakerAssignment.findMany({
    where: { propertyId },
    orderBy: { createdAt: "asc" },
    include: { caretaker: true },
  });
}

export function getCaretakerAssignments(caretakerId: string) {
  return prisma.caretakerAssignment.findMany({
    where: { caretakerId },
    orderBy: { createdAt: "desc" },
    include: {
      property: {
        include: {
          units: {
            orderBy: { label: "asc" },
            include: {
              leases: { where: { status: "ACTIVE" }, include: { tenant: true }, take: 1 },
            },
          },
        },
      },
    },
  });
}

export function getLeaseAgreementData(leaseId: string) {
  return prisma.lease.findUnique({
    where: { id: leaseId },
    include: {
      tenant: true,
      unit: { include: { property: { include: { landlord: true } } } },
    },
  });
}

export function getLeaseWithDetails(leaseId: string) {
  return prisma.lease.findUnique({
    where: { id: leaseId },
    include: {
      tenant: { include: { documents: { orderBy: { createdAt: "desc" } } } },
      unit: { include: { property: true } },
      invoices: {
        orderBy: { dueDate: "desc" },
        include: { payments: { include: { receipt: true } } },
      },
      rentChanges: { orderBy: { effectiveDate: "asc" } },
      reviews: true,
      inspections: {
        orderBy: { createdAt: "asc" },
        include: {
          items: true,
          photos: { orderBy: { createdAt: "asc" } },
          conductedBy: { select: { name: true } },
        },
      },
    },
  });
}

export function getTenantActiveLeases(tenantId: string) {
  return prisma.lease.findMany({
    where: { tenantId, status: "ACTIVE" },
    include: {
      unit: {
        include: {
          property: {
            include: {
              landlord: true,
              images: { orderBy: [{ featured: "desc" }, { order: "asc" }] },
            },
          },
        },
      },
      invoices: {
        orderBy: { dueDate: "desc" },
        include: { payments: { include: { receipt: true } } },
      },
      rentChanges: { orderBy: { effectiveDate: "asc" } },
      complaints: { orderBy: { createdAt: "desc" }, include: { images: true } },
      reviews: true,
    },
  });
}

export async function getTenantScreeningReport(tenantId: string) {
  const [leases, reviewAgg, recentReviews, invoices] = await Promise.all([
    prisma.lease.findMany({
      where: { tenantId },
      select: { id: true, status: true, startDate: true, endDate: true },
    }),
    prisma.review.aggregate({
      where: { targetId: tenantId, direction: "LANDLORD_TO_TENANT" },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.review.findMany({
      where: { targetId: tenantId, direction: "LANDLORD_TO_TENANT", comment: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { author: { select: { name: true } } },
    }),
    prisma.rentInvoice.findMany({
      where: { lease: { tenantId }, status: "PAID" },
      include: { payments: { orderBy: { paidAt: "asc" }, take: 1 } },
    }),
  ]);

  let paidOnTime = 0;
  for (const inv of invoices) {
    const firstPayment = inv.payments[0];
    if (firstPayment && firstPayment.paidAt <= inv.dueDate) paidOnTime += 1;
  }

  return {
    totalLeases: leases.length,
    activeLeases: leases.filter((l) => l.status === "ACTIVE").length,
    endedLeases: leases.filter((l) => l.status === "ENDED").length,
    terminatedLeases: leases.filter((l) => l.status === "TERMINATED").length,
    onTimePaymentRate: invoices.length > 0 ? paidOnTime / invoices.length : null,
    settledInvoiceCount: invoices.length,
    averageRating: reviewAgg._avg.rating,
    reviewCount: reviewAgg._count,
    recentReviews,
  };
}

export async function getLandlordRatingSummary(landlordId: string) {
  const [agg, recent] = await Promise.all([
    prisma.review.aggregate({
      where: { targetId: landlordId, direction: "TENANT_TO_LANDLORD" },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.review.findMany({
      where: { targetId: landlordId, direction: "TENANT_TO_LANDLORD", comment: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { author: { select: { name: true } } },
    }),
  ]);

  return {
    average: agg._avg.rating ?? 0,
    count: agg._count,
    recent,
  };
}

export async function getPropertyReviews(propertyId: string) {
  const [agg, recent] = await Promise.all([
    prisma.review.aggregate({
      where: { propertyId, direction: "TENANT_TO_LANDLORD" },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.review.findMany({
      where: { propertyId, direction: "TENANT_TO_LANDLORD", comment: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { author: { select: { name: true } } },
    }),
  ]);

  return {
    average: agg._avg.rating ?? 0,
    count: agg._count,
    recent,
  };
}

export function getLandlordComplaints(landlordId: string) {
  return prisma.complaint.findMany({
    where: { lease: { unit: { property: { landlordId } } } },
    orderBy: { createdAt: "desc" },
    include: { tenant: true, lease: { include: { unit: { include: { property: true } } } } },
  });
}

export function getCaretakerComplaints(caretakerId: string) {
  return prisma.complaint.findMany({
    where: { lease: { unit: { property: { caretakerAssignments: { some: { caretakerId } } } } } },
    orderBy: { createdAt: "desc" },
    include: { tenant: true, lease: { include: { unit: { include: { property: true } } } } },
  });
}

export function getComplaintDetail(complaintId: string) {
  return prisma.complaint.findUnique({
    where: { id: complaintId },
    include: {
      tenant: true,
      lease: { include: { unit: { include: { property: true } } } },
      images: { orderBy: { createdAt: "asc" } },
    },
  });
}

export function getTenantDocuments(tenantId: string) {
  return prisma.tenantDocument.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTenantStats(tenantId: string) {
  const [paidAgg, openInvoices] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: "SUCCESSFUL", invoice: { lease: { tenantId } } },
      _sum: { amount: true },
    }),
    prisma.rentInvoice.findMany({
      where: { lease: { tenantId, status: "ACTIVE" }, status: { not: "PAID" } },
      orderBy: { dueDate: "asc" },
      include: {
        payments: true,
        lease: { include: { unit: { include: { property: true } } } },
      },
    }),
  ]);

  let outstandingBalance = 0;
  let nextDue: { amount: number; dueDate: Date; propertyLabel: string } | null = null;

  for (const invoice of openInvoices) {
    const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = invoiceTotalDue(invoice) - paid;
    if (remaining <= 0) continue;

    outstandingBalance += remaining;
    if (!nextDue || invoice.dueDate < nextDue.dueDate) {
      nextDue = {
        amount: remaining,
        dueDate: invoice.dueDate,
        propertyLabel: `${invoice.lease.unit.property.name} — ${invoice.lease.unit.label}`,
      };
    }
  }

  return {
    totalPaid: Number(paidAgg._sum.amount ?? 0),
    outstandingBalance,
    nextDue,
  };
}
