import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getLandlordFinancialSummary, getLandlordInvoices, getLandlordProperties } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge, Card } from "@/components/ui";
import { formatMoney, type Currency } from "@/lib/money";
import { invoiceDisplayStatus, isInvoiceDueSoon } from "@/lib/invoice-status";
import { invoiceTotalDue } from "@/lib/invoice-total";
import { LANDLORD_NAV } from "@/lib/landlord-nav";
import { SendReminderButton } from "@/components/forms/send-reminder-button";

const STATUS_TONE = {
  PAID: "green",
  PARTIAL: "amber",
  OVERDUE: "red",
  PENDING: "slate",
} as const;

/** Most landlords collect in a single currency; joins the rare mixed case rather than summing raw numbers. */
function formatByCurrency(entries: { currency: string; amount: number }[]): string {
  if (entries.length === 0) return formatMoney(0, "UGX");
  return entries.map((e) => formatMoney(e.amount, e.currency as Currency)).join(" + ");
}

export default async function LandlordDashboard() {
  const user = await requireUser("LANDLORD");
  const [properties, invoices, financials] = await Promise.all([
    getLandlordProperties(user.id),
    getLandlordInvoices(user.id),
    getLandlordFinancialSummary(user.id),
  ]);

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
    <DashboardShell title="Dashboard" userName={user.name ?? ""} nav={LANDLORD_NAV}>
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/landlord/properties/new"
          className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Add property
        </Link>
        <Link
          href="/landlord/properties"
          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Manage properties
        </Link>
        <Link
          href="/landlord/tenants"
          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          View tenants
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-500">Units</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {occupiedCount}/{unitCount} occupied
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Collected this month</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {formatByCurrency(financials.collectedThisMonthByCurrency)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Outstanding rent</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatByCurrency(outstandingByCurrency)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Overdue invoices</p>
          <p className="mt-1 text-2xl font-semibold text-red-700">{overdue.length}</p>
        </Card>
      </div>

      <p className="mt-2 text-sm text-slate-500">
        {formatByCurrency(financials.collectedThisYearByCurrency)} collected so far this year.
      </p>

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
                      className="font-medium text-emerald-700 hover:text-emerald-800"
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
        <Link href="/landlord/tenants" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
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
                        className="font-medium text-emerald-700 hover:text-emerald-800"
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
        <Link href="/landlord/properties" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
          Manage properties →
        </Link>
      </div>

      <Card className="mt-3 overflow-hidden p-0">
        {properties.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            No properties yet.{" "}
            <Link href="/landlord/properties/new" className="font-medium text-emerald-700 hover:text-emerald-800">
              Add your first one
            </Link>
            .
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
                      className="font-medium text-emerald-700 hover:text-emerald-800"
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
