import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getLandlordAnalytics } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui";
import { formatMoney, type Currency } from "@/lib/money";
import { navForRole } from "@/lib/landlord-nav";

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  MOBILE_MONEY: "Mobile Money",
  BANK: "Bank transfer",
};

/** Most landlords collect in a single currency; joins the rare mixed case rather than summing raw numbers. */
function formatByCurrency(entries: { currency: string; amount: number }[]): string {
  if (entries.length === 0) return formatMoney(0, "UGX");
  return entries.map((e) => formatMoney(e.amount, e.currency as Currency)).join(" + ");
}

export default async function ReportsPage() {
  const user = await requireUser(["LANDLORD", "PROPERTY_MANAGER"]);
  const analytics = await getLandlordAnalytics(user.id);
  const maxTrend = Math.max(1, ...analytics.trend.map((t) => t.amount));
  const maxRevenueByProperty = Math.max(1, ...analytics.revenueByProperty.map((p) => p.amount));

  return (
    <DashboardShell title="Reports" userName={user.name ?? ""} nav={navForRole(user.role)}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Occupancy, collections, and arrears across your portfolio.</p>
        <div className="flex gap-2">
          <Link
            href="/landlord/payments"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View all payments
          </Link>
          <a
            href="/api/landlord/reports/export"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export payments (CSV)
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-medium text-slate-500">Occupancy rate</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {(analytics.occupancyRate * 100).toFixed(0)}%
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {analytics.occupiedUnits} of {analytics.totalUnits} units occupied
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-slate-500">Collected this month</p>
          <p className="mt-1 text-2xl font-semibold text-ivy-700">
            {formatMoney(analytics.trend[analytics.trend.length - 1]?.amount ?? 0, analytics.primaryCurrency)}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-slate-500">Total arrears</p>
          <p className="mt-1 text-2xl font-semibold text-red-700">
            {formatByCurrency(analytics.totalArrearsByCurrency)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {analytics.arrears.length} tenant{analytics.arrears.length === 1 ? "" : "s"} behind
          </p>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-1 text-sm font-medium text-slate-900">Collections — last 6 months</h2>
        <p className="mb-4 text-xs text-slate-400">
          Shown in {analytics.primaryCurrency}, your primary collection currency.
          {analytics.otherCurrencyTotals.length > 0 && (
            <> Also collected: {formatByCurrency(analytics.otherCurrencyTotals)}.</>
          )}
        </p>
        <div className="flex items-end gap-3" style={{ height: 140 }}>
          {analytics.trend.map((t) => (
            <div key={t.label} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t bg-ivy-600"
                  style={{ height: `${Math.max(4, (t.amount / maxTrend) * 100)}%` }}
                  title={formatMoney(t.amount, analytics.primaryCurrency)}
                />
              </div>
              <span className="text-xs text-slate-500">{t.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-slate-900">
          Revenue by property — last 6 months ({analytics.primaryCurrency})
        </h2>
        {analytics.revenueByProperty.length === 0 ? (
          <p className="text-sm text-slate-500">No payments recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {analytics.revenueByProperty.map((p) => (
              <div key={p.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{p.name}</span>
                  <span className="text-slate-500">{formatMoney(p.amount, analytics.primaryCurrency)}</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-ivy-600"
                    style={{ width: `${(p.amount / maxRevenueByProperty) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="mb-1 text-sm font-medium text-slate-900">Vacancy trend — last 6 months</h2>
        <p className="mb-4 text-xs text-slate-400">
          Approximated from lease date ranges against your current unit count.
        </p>
        <div className="flex items-end gap-3" style={{ height: 140 }}>
          {analytics.vacancyTrend.map((t) => (
            <div key={t.label} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t bg-ivy-600"
                  style={{ height: `${Math.max(4, t.occupancyRate * 100)}%` }}
                  title={`${(t.occupancyRate * 100).toFixed(0)}% occupied`}
                />
              </div>
              <span className="text-xs text-slate-500">{t.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-slate-900">Leases expiring in the next 90 days</h2>
        {analytics.leaseExpirationTimeline.length === 0 ? (
          <p className="text-sm text-slate-500">No leases expiring soon.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {analytics.leaseExpirationTimeline.map((l) => (
              <li key={l.leaseId} className="flex items-center justify-between border-t border-slate-100 pt-2 first:border-0 first:pt-0">
                <div>
                  <span className="text-slate-900">{l.tenantName}</span>
                  <span className="text-slate-500"> · {l.propertyLabel}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-700">{new Date(l.endDate).toLocaleDateString("en-UG")}</span>
                  <span className="ml-2 text-xs text-slate-400">
                    ({l.daysUntilEnd} day{l.daysUntilEnd === 1 ? "" : "s"})
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-slate-900">Collections by method — last 6 months</h2>
        {analytics.byMethod.length === 0 ? (
          <p className="text-sm text-slate-500">No payments recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {analytics.byMethod.map((m) => (
              <div key={m.method}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{METHOD_LABELS[m.method] ?? m.method}</span>
                  <span className="text-slate-500">
                    {formatMoney(m.amount, analytics.primaryCurrency)} ({(m.share * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-ivy-600" style={{ width: `${m.share * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-slate-900">Occupancy by property</h2>
        {analytics.byProperty.length === 0 ? (
          <p className="text-sm text-slate-500">No properties yet.</p>
        ) : (
          <div className="space-y-3">
            {analytics.byProperty.map((p) => (
              <div key={p.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{p.name}</span>
                  <span className="text-slate-500">
                    {p.occupied}/{p.total} occupied
                  </span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-ivy-600"
                    style={{ width: `${p.total > 0 ? (p.occupied / p.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-slate-900">Arrears by tenant</h2>
        {analytics.arrears.length === 0 ? (
          <p className="text-sm text-slate-500">No outstanding balances. Nice work.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2 font-medium">Tenant</th>
                <th className="py-2 font-medium">Property / Unit</th>
                <th className="py-2 font-medium">Oldest due</th>
                <th className="py-2 text-right font-medium">Amount owed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.arrears.map((a) => (
                <tr key={`${a.tenantId}:${a.currency}`}>
                  <td className="py-2 text-slate-900">{a.tenantName}</td>
                  <td className="py-2 text-slate-600">{a.propertyLabel}</td>
                  <td className="py-2 text-slate-600">
                    {new Date(a.oldestDueDate).toLocaleDateString("en-UG")}
                  </td>
                  <td className="py-2 text-right font-medium text-red-700">
                    {formatMoney(a.amount, a.currency as Currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </DashboardShell>
  );
}
