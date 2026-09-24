import { prisma } from "@/lib/prisma";
import type { Currency, Prisma, PropertyListingType, PropertyType, PropertyUsage } from "@prisma/client";
import { invoiceTotalDue } from "@/lib/invoice-total";

/**
 * Matches a property owned by this user (as landlord) or a property they've
 * been appointed to manage (as property manager, who gets landlord-equivalent
 * access). Used to scope every "landlord's data" query so property managers
 * see exactly what the landlord who appointed them would see.
 */
export function landlordOrManagerFilter(userId: string) {
  return { OR: [{ landlordId: userId }, { propertyManagerAssignments: { some: { managerId: userId } } }] };
}

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

export async function getAdminOverviewStats() {
  const [
    usersByRole,
    totalProperties,
    salePropertyCount,
    activeLeaseCount,
    revenueByCurrency,
    monthRevenueByCurrency,
    openComplaintCount,
    openMaintenanceCount,
    recentUsers,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.property.count(),
    prisma.property.count({ where: { listingType: "SALE" } }),
    prisma.lease.count({ where: { status: "ACTIVE" } }),
    prisma.payment.groupBy({ by: ["currency"], where: { status: "SUCCESSFUL" }, _sum: { amount: true } }),
    prisma.payment.groupBy({
      by: ["currency"],
      where: { status: "SUCCESSFUL", paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      _sum: { amount: true },
    }),
    prisma.complaint.count({ where: { status: { not: "RESOLVED" } } }),
    prisma.maintenanceRequest.count({ where: { status: { in: ["OPEN", "SCHEDULED", "IN_PROGRESS"] } } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, name: true, phone: true, role: true, createdAt: true } }),
  ]);

  const roleCounts: Record<string, number> = {};
  for (const row of usersByRole) {
    roleCounts[row.role ?? "UNASSIGNED"] = row._count;
  }

  return {
    roleCounts,
    totalUsers: usersByRole.reduce((sum, r) => sum + r._count, 0),
    totalProperties,
    rentalPropertyCount: totalProperties - salePropertyCount,
    salePropertyCount,
    activeLeaseCount,
    totalRevenueByCurrency: revenueByCurrency.map((r) => ({ currency: r.currency, amount: Number(r._sum.amount ?? 0) })),
    revenueThisMonthByCurrency: monthRevenueByCurrency.map((r) => ({
      currency: r.currency,
      amount: Number(r._sum.amount ?? 0),
    })),
    openComplaintCount,
    openMaintenanceCount,
    recentUsers,
  };
}

export function getAllUsersAdmin() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      suspended: true,
      createdAt: true,
    },
  });
}

export async function getUserAdminDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      properties: { select: { id: true, name: true, listingType: true, _count: { select: { units: true } } } },
      leasesAsTenant: {
        select: { id: true, status: true, unit: { select: { label: true, property: { select: { name: true } } } } },
      },
      caretakerAssignments: { include: { property: { select: { id: true, name: true } } } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!user) return null;

  const auditLogs = await prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return { user, auditLogs };
}

export function getAllPropertiesAdmin() {
  return prisma.property.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: {
      landlord: { select: { name: true, phone: true } },
      _count: { select: { units: true } },
    },
  });
}

export function getAllComplaintsAdmin() {
  return prisma.complaint.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { tenant: true, lease: { include: { unit: { include: { property: true } } } } },
  });
}

export function getAllMaintenanceAdmin() {
  return prisma.maintenanceRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { property: true, unit: true, createdBy: { select: { name: true } } },
  });
}

export function getAllAuditLogsAdmin() {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { user: { select: { name: true, phone: true, role: true } } },
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
    where: landlordOrManagerFilter(landlordId),
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
    where: { lease: { unit: { property: landlordOrManagerFilter(landlordId) } } },
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
    prisma.payment.groupBy({
      by: ["currency"],
      where: {
        status: "SUCCESSFUL",
        paidAt: { gte: startOfMonth },
        invoice: { lease: { unit: { property: landlordOrManagerFilter(landlordId) } } },
      },
      _sum: { amount: true },
    }),
    prisma.payment.groupBy({
      by: ["currency"],
      where: {
        status: "SUCCESSFUL",
        paidAt: { gte: startOfYear },
        invoice: { lease: { unit: { property: landlordOrManagerFilter(landlordId) } } },
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    collectedThisMonthByCurrency: monthAgg.map((g) => ({ currency: g.currency, amount: Number(g._sum.amount ?? 0) })),
    collectedThisYearByCurrency: yearAgg.map((g) => ({ currency: g.currency, amount: Number(g._sum.amount ?? 0) })),
  };
}

export function getLandlordTenants(landlordId: string) {
  return prisma.lease.findMany({
    where: { unit: { property: landlordOrManagerFilter(landlordId) } },
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
    where: { invoice: { lease: { unit: { property: landlordOrManagerFilter(landlordId) } } } },
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

  const expectedByCurrency = new Map<string, number>();
  for (const inv of invoices) {
    expectedByCurrency.set(inv.currency, (expectedByCurrency.get(inv.currency) ?? 0) + invoiceTotalDue(inv));
  }

  const payments = await prisma.payment.findMany({
    where: {
      status: "SUCCESSFUL",
      paidAt: { gte: start, lt: end },
      invoice: { lease: { unit: { propertyId } } },
    },
    include: { invoice: { include: { lease: { include: { tenant: true, unit: true } } } } },
  });
  const collectedByCurrency = new Map<string, number>();
  for (const p of payments) {
    collectedByCurrency.set(p.currency, (collectedByCurrency.get(p.currency) ?? 0) + Number(p.amount));
  }

  const maintenance = await prisma.maintenanceRequest.findMany({
    where: {
      propertyId,
      status: "COMPLETED",
      completedAt: { gte: start, lt: end },
      cost: { not: null },
    },
  });
  // Maintenance costs are tracked in UGX only for now; only subtracted from the UGX net income figure.
  const maintenanceCost = maintenance.reduce((sum, m) => sum + Number(m.cost ?? 0), 0);

  const currencies = new Set([...expectedByCurrency.keys(), ...collectedByCurrency.keys(), "UGX"]);
  const byCurrency = (map: Map<string, number>) =>
    Array.from(currencies)
      .map((currency) => ({ currency, amount: map.get(currency) ?? 0 }))
      .filter((e) => e.amount !== 0 || e.currency === "UGX");

  const expectedRentByCurrency = byCurrency(expectedByCurrency);
  const collectedByCurrencyList = byCurrency(collectedByCurrency);
  const outstandingByCurrency = Array.from(currencies)
    .map((currency) => ({
      currency,
      amount: Math.max((expectedByCurrency.get(currency) ?? 0) - (collectedByCurrency.get(currency) ?? 0), 0),
    }))
    .filter((e) => e.amount !== 0 || e.currency === "UGX");
  const netIncomeByCurrency = Array.from(currencies)
    .map((currency) => ({
      currency,
      amount: (collectedByCurrency.get(currency) ?? 0) - (currency === "UGX" ? maintenanceCost : 0),
    }))
    .filter((e) => e.amount !== 0 || e.currency === "UGX");

  return {
    property,
    periodStart: start,
    periodEnd: end,
    expectedRentByCurrency,
    collectedByCurrency: collectedByCurrencyList,
    outstandingByCurrency,
    maintenanceCost,
    netIncomeByCurrency,
    invoices,
    payments,
    maintenance,
  };
}

export async function getLandlordAnalytics(landlordId: string) {
  const units = await prisma.unit.findMany({
    where: { property: landlordOrManagerFilter(landlordId) },
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
      invoice: { lease: { unit: { property: landlordOrManagerFilter(landlordId) } } },
    },
    select: { amount: true, paidAt: true, method: true, currency: true },
  });

  // A landlord's payments are overwhelmingly in one currency in practice, so
  // the trend chart and method breakdown focus on whichever currency has the
  // most collected volume; any other currency present is called out
  // separately rather than silently summed into the wrong total.
  const volumeByCurrency = new Map<string, number>();
  for (const p of payments) {
    volumeByCurrency.set(p.currency, (volumeByCurrency.get(p.currency) ?? 0) + Number(p.amount));
  }
  const primaryCurrency = (Array.from(volumeByCurrency.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "UGX") as Currency;
  const otherCurrencyTotals = Array.from(volumeByCurrency.entries())
    .filter(([currency]) => currency !== primaryCurrency)
    .map(([currency, amount]) => ({ currency, amount }));

  const primaryPayments = payments.filter((p) => p.currency === primaryCurrency);

  const byMethodMap = new Map<string, number>();
  for (const p of primaryPayments) {
    byMethodMap.set(p.method, (byMethodMap.get(p.method) ?? 0) + Number(p.amount));
  }
  const totalCollected = primaryPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const byMethod = Array.from(byMethodMap.entries())
    .map(([method, amount]) => ({ method, amount, share: totalCollected > 0 ? amount / totalCollected : 0 }))
    .sort((a, b) => b.amount - a.amount);

  const trend = months.map(({ label, start, end }) => ({
    label,
    amount: primaryPayments
      .filter((p) => p.paidAt >= start && p.paidAt < end)
      .reduce((sum, p) => sum + Number(p.amount), 0),
  }));

  const openInvoices = await prisma.rentInvoice.findMany({
    where: { status: { not: "PAID" }, lease: { unit: { property: landlordOrManagerFilter(landlordId) } } },
    include: {
      payments: true,
      lease: { include: { tenant: true, unit: { include: { property: true } } } },
    },
    orderBy: { dueDate: "asc" },
  });

  const totalArrearsByCurrencyMap = new Map<string, number>();
  const arrearsByTenant = new Map<
    string,
    { tenantId: string; tenantName: string; propertyLabel: string; amount: number; currency: string; oldestDueDate: Date }
  >();
  for (const inv of openInvoices) {
    const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = invoiceTotalDue(inv) - paid;
    if (remaining <= 0) continue;
    totalArrearsByCurrencyMap.set(inv.currency, (totalArrearsByCurrencyMap.get(inv.currency) ?? 0) + remaining);
    // Keyed by tenant + currency: a tenant with unpaid leases in two
    // currencies shows as two rows rather than an incorrectly summed one.
    const key = `${inv.lease.tenantId}:${inv.currency}`;
    const entry = arrearsByTenant.get(key) ?? {
      tenantId: inv.lease.tenantId,
      tenantName: inv.lease.tenant.name,
      propertyLabel: `${inv.lease.unit.property.name} — ${inv.lease.unit.label}`,
      amount: 0,
      currency: inv.currency,
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
    primaryCurrency,
    otherCurrencyTotals,
    byMethod,
    totalArrearsByCurrency: Array.from(totalArrearsByCurrencyMap.entries()).map(([currency, amount]) => ({
      currency,
      amount,
    })),
    arrears: Array.from(arrearsByTenant.values()).sort((a, b) => b.amount - a.amount),
  };
}

export function getLandlordMaintenanceRequests(landlordId: string) {
  return prisma.maintenanceRequest.findMany({
    where: { property: landlordOrManagerFilter(landlordId) },
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
    where: { lease: { unit: { property: landlordOrManagerFilter(landlordId) } } },
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
  const [payments, openInvoices] = await Promise.all([
    prisma.payment.findMany({
      where: { status: "SUCCESSFUL", invoice: { lease: { tenantId } } },
      select: { amount: true, currency: true },
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

  // A tenant could in principle hold leases in more than one currency, so
  // totals are grouped by currency rather than naively summed together.
  const totalPaidByCurrency = new Map<string, number>();
  for (const p of payments) {
    totalPaidByCurrency.set(p.currency, (totalPaidByCurrency.get(p.currency) ?? 0) + Number(p.amount));
  }

  const outstandingByCurrency = new Map<string, number>();
  let nextDue: { amount: number; dueDate: Date; propertyLabel: string; currency: string } | null = null;

  for (const invoice of openInvoices) {
    const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = invoiceTotalDue(invoice) - paid;
    if (remaining <= 0) continue;

    outstandingByCurrency.set(invoice.currency, (outstandingByCurrency.get(invoice.currency) ?? 0) + remaining);
    if (!nextDue || invoice.dueDate < nextDue.dueDate) {
      nextDue = {
        amount: remaining,
        dueDate: invoice.dueDate,
        propertyLabel: `${invoice.lease.unit.property.name} — ${invoice.lease.unit.label}`,
        currency: invoice.currency,
      };
    }
  }

  return {
    totalPaidByCurrency: Array.from(totalPaidByCurrency.entries()).map(([currency, amount]) => ({
      currency,
      amount,
    })),
    outstandingByCurrency: Array.from(outstandingByCurrency.entries()).map(([currency, amount]) => ({
      currency,
      amount,
    })),
    nextDue,
  };
}
