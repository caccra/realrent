import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getLandlordFinancialSummary, getLandlordInvoices, getLandlordPayments, getLandlordProperties } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge, Card } from "@/components/ui";
import { formatMoney, type Currency } from "@/lib/money";
import { invoiceDisplayStatus, isInvoiceDueSoon } from "@/lib/invoice-status";
import { invoiceTotalDue } from "@/lib/invoice-total";
import { navForRole } from "@/lib/landlord-nav";
import { SendReminderButton } from "@/components/forms/send-reminder-button";
import { initials } from "@/lib/initials";

const STATUS_TONE = {
  PAID: "green",
  PARTIAL: "amber",
  OVERDUE: "red",
  PENDING: "slate",
} as const;

const AVATAR_STYLES = ["bg-ivy-100 text-ivy-800", "bg-ivy-700 text-white", "bg-clay/15 text-clay", "bg-clay text-white"];

const STAT_ICONS = {
  building: "M4 21V7l8-4 8 4v14M9 21v-6h6v6M4 21h16",
  cash: "M3 8h18M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2zM7 15h4",
  clock: "M12 8v4l3 3M12 21a9 9 0 100-18 9 9 0 000 18z",
  alert: "M12 9v4m0 4h.01M10.3 3.9L2.8 17a2 2 0 001.7 3h15a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
} as const;

function StatIcon({ path, chip }: { path: string; chip: string }) {
  return (
    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${chip} text-white`}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
      </svg>
    </span>
  );
}

/** Uganda-local (not server-local) time of day, so the greeting is never wrong because the server runs in a different timezone. */
function ugandaGreeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Kampala", hour: "numeric", hour12: false }).format(new Date())
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function ugandaDateLabel(): string {
  return new Intl.DateTimeFormat("en-UG", {
    timeZone: "Africa/Kampala",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

/** Most landlords collect in a single currency; joins the rare mixed case rather than summing raw numbers. */
function formatByCurrency(entries: { currency: string; amount: number }[]): string {
  if (entries.length === 0) return formatMoney(0, "UGX");
  return entries.map((e) => formatMoney(e.amount, e.currency as Currency)).join(" + ");
}

export default async function LandlordDashboard() {
  const user = await requireUser(["LANDLORD", "PROPERTY_MANAGER"]);
  const isLandlord = user.role === "LANDLORD";
  const [properties, invoices, financials, payments] = await Promise.all([
    getLandlordProperties(user.id),
    getLandlordInvoices(user.id),
    getLandlordFinancialSummary(user.id),
    getLandlordPayments(user.id),
  ]);
  const recentPayments = payments.filter((p) => p.status === "SUCCESSFUL").slice(0, 5);

  const unitCount = properties.reduce((sum, p) => sum + p.units.length, 0);
  const occupiedCount = properties.reduce(
    (sum, p) => sum + p.units.filter((u) => u.status === "OCCUPIED").length,
    0
  );

  const outstanding = invoices.filter((inv) => invoiceDisplayStatus(inv) !== "PAID");
  const overdue = invoices.filter((inv) => invoiceDisplayStatus(inv) === "OVERDUE");
  const dueSoon = invoices.filter((inv) => isInvoiceDueSoon(inv));

  const outstandingByCurrencyMap = new Map<string, number>();
  for (const inv of outstanding) {
    outstandingByCurrencyMap.set(inv.currency, (outstandingByCurrencyMap.get(inv.currency) ?? 0) + invoiceTotalDue(inv));
  }
  const outstandingByCurrency = Array.from(outstandingByCurrencyMap.entries()).map(([currency, amount]) => ({
    currency,
    amount,
  }));

  return (
    <DashboardShell title="Dashboard" userName={user.name ?? ""} nav={navForRole(user.role)}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{ugandaDateLabel()}</p>
          <p className="text-lg font-semibold text-slate-900">
            {ugandaGreeting()}, {user.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isLandlord && (
            <Link
              href="/landlord/properties/new"
              className="inline-flex items-center justify-center rounded-md bg-ivy-900 px-4 py-2 text-sm font-medium text-white hover:bg-ivy-800"
            >
              + Add property
            </Link>
          )}
          <Link
            href="/landlord/tenants"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View tenants
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <StatIcon path={STAT_ICONS.cash} chip="bg-ivy-700" />
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">Collected this month</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {formatByCurrency(financials.collectedThisMonthByCurrency)}
          </p>
        </Card>
        <Card>
          <StatIcon path={STAT_ICONS.building} chip="bg-clay" />
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">Occupancy</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {unitCount > 0 ? Math.round((occupiedCount / unitCount) * 100) : 0}%
          </p>
          <p className="text-xs text-slate-400">
            {occupiedCount} of {unitCount} units
          </p>
        </Card>
        <Card>
          <StatIcon path={STAT_ICONS.clock} chip="bg-ivy-900" />
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">Outstanding rent</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{formatByCurrency(outstandingByCurrency)}</p>
        </Card>
        <Card>
          <StatIcon path={STAT_ICONS.alert} chip="bg-red-600" />
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">Overdue invoices</p>
          <p className="mt-1 text-xl font-semibold text-red-700">{overdue.length}</p>
        </Card>
      </div>

      <p className="mt-2 text-sm text-slate-500">
        {formatByCurrency(financials.collectedThisYearByCurrency)} collected so far this year.
      </p>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">Recent payments</h2>
        <Link href="/landlord/payments" className="text-sm font-medium text-ivy-700 hover:text-ivy-800">
          View all
        </Link>
      </div>
      <Card className="mt-3 overflow-hidden p-0">
        {recentPayments.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No payments recorded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentPayments.map((p, i) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${AVATAR_STYLES[i % AVATAR_STYLES.length]}`}
                  >
                    {initials(p.invoice.lease.tenant.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-900">
                      {p.invoice.lease.tenant.name}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {p.invoice.lease.unit.label} · {p.invoice.lease.unit.property.name}
                    </span>
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm text-slate-700">{formatMoney(p.amount.toString(), p.currency)}</span>
                  <Badge tone="green">Paid</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {dueSoon.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-medium text-slate-900">Due in the next 7 days</h2>
          <Card className="overflow-hidden p-0">
            <ul className="divide-y divide-slate-100">
              {dueSoon.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="text-slate-900">{inv.lease.tenant.name}</p>
                    <p className="text-slate-500">
                      {inv.lease.unit.property.name} — {inv.lease.unit.label} · Due{" "}
                      {new Date(inv.dueDate).toLocaleDateString("en-UG")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-900">{formatMoney(invoiceTotalDue(inv), inv.currency)}</span>
                    <Link
                      href={`/landlord/leases/${inv.leaseId}`}
                      className="font-medium text-ivy-700 hover:text-ivy-800"
                    >
                      View
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">Invoices needing attention</h2>
        <Link href="/landlord/tenants" className="text-sm font-medium text-ivy-700 hover:text-ivy-800">
          View all tenants →
        </Link>
      </div>

      <Card className="mt-3 overflow-hidden p-0">
        {outstanding.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No outstanding rent. Everything is paid up.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Tenant</th>
                <th className="px-4 py-2 font-medium">Unit</th>
                <th className="px-4 py-2 font-medium">Due date</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2" />
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {outstanding.slice(0, 20).map((inv) => {
                const status = invoiceDisplayStatus(inv);
                return (
                  <tr key={inv.id}>
                    <td className="px-4 py-2 text-slate-900">{inv.lease.tenant.name}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {inv.lease.unit.property.name} — {inv.lease.unit.label}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {new Date(inv.dueDate).toLocaleDateString("en-UG")}
                    </td>
                    <td className="px-4 py-2 text-slate-900">{formatMoney(invoiceTotalDue(inv), inv.currency)}</td>
                    <td className="px-4 py-2">
                      <Badge tone={STATUS_TONE[status]}>{status}</Badge>
                    </td>
                    <td className="px-4 py-2">
                      <SendReminderButton invoiceId={inv.id} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/landlord/leases/${inv.leaseId}`}
                        className="font-medium text-ivy-700 hover:text-ivy-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">Your properties</h2>
        <Link href="/landlord/properties" className="text-sm font-medium text-ivy-700 hover:text-ivy-800">
          Manage properties →
        </Link>
      </div>

      <Card className="mt-3 overflow-hidden p-0">
        {properties.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            {isLandlord ? (
              <>
                No properties yet.{" "}
                <Link
                  href="/landlord/properties/new"
                  className="font-medium text-ivy-700 hover:text-ivy-800"
                >
                  Add your first one
                </Link>
                .
              </>
            ) : (
              "You haven't been appointed to any property yet. Ask the landlord to appoint you using your phone number."
            )}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {properties.slice(0, 6).map((property) => {
              const occupied = property.units.filter((u) => u.status === "OCCUPIED").length;
              return (
                <li key={property.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="text-slate-900">{property.name}</p>
                    <p className="text-slate-500">{property.address}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600">
                      {occupied}/{property.units.length} occupied
                    </span>
                    <Link
                      href={`/landlord/properties/${property.id}`}
                      className="font-medium text-ivy-700 hover:text-ivy-800"
                    >
                      View
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </DashboardShell>
  );
}
