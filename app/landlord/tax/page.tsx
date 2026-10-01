import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { currentTaxYearStart, getRentalTaxSummary } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui";
import { PrintButton } from "@/components/print-button";
import { formatMoney, type Currency } from "@/lib/money";
import { navForRole } from "@/lib/landlord-nav";
import { EXPENSE_CATEGORIES } from "@/lib/validations/expense";

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.value, c.label])
);

const ENTITY_GUIDANCE = {
  INDIVIDUAL:
    "As an individual, rental income is taxed separately from your other income under URA's individual rental tax schedule, with its own threshold and rate. Confirm the current threshold and rate with URA or your tax advisor before filing.",
  COMPANY_OR_TRUST:
    "As a company or trust, rental income is included in your normal corporate income tax return rather than a separate schedule, and expense deductions may be treated differently than for an individual. Confirm the current corporate rate and deduction rules with URA or your tax advisor before filing.",
} as const;

export default async function RentalTaxPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const user = await requireUser(["LANDLORD", "PROPERTY_MANAGER"]);
  const { year } = await searchParams;
  const current = currentTaxYearStart();
  const startYear = year ? parseInt(year, 10) : current;
  const safeStartYear = Number.isFinite(startYear) ? startYear : current;

  const summary = await getRentalTaxSummary(user.id, safeStartYear);

  // A property manager's assigned properties can belong to different
  // landlords who may file as different entity types, so only show
  // entity-specific guidance when the viewer is the landlord themselves.
  const taxpayerType =
    user.role === "LANDLORD"
      ? (await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { taxpayerType: true } }))
          .taxpayerType
      : null;

  return (
    <DashboardShell title="Rental Tax Summary" userName={user.name ?? ""} nav={navForRole(user.role)}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href={`/landlord/tax?year=${safeStartYear - 1}`}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            ← {safeStartYear - 1}/{safeStartYear}
          </Link>
          <p className="text-sm font-medium text-slate-900">Tax year {summary.label}</p>
          {safeStartYear < current && (
            <Link
              href={`/landlord/tax?year=${safeStartYear + 1}`}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              {safeStartYear + 1}/{safeStartYear + 2} →
            </Link>
          )}
        </div>
        <PrintButton label="Print summary" />
      </div>

      <Card className="mb-6 border-amber-200 bg-amber-50">
        <p className="text-sm font-medium text-amber-900">This is a reference summary, not a tax calculation</p>
        <p className="mt-1 text-sm text-amber-800">
          It reports real rental income received and expenses recorded on Kezavi for{" "}
          <strong>1 July {summary.periodStart.getFullYear()} – 30 June {summary.periodEnd.getFullYear()}</strong>, the
          URA rental-tax year. It does not apply any tax rate or threshold. Amounts are shown per currency as
          recorded; USD figures need converting to UGX at the prevailing rate for your return.
        </p>
        <p className="mt-2 text-sm text-amber-800">
          {taxpayerType ? (
            <>
              {ENTITY_GUIDANCE[taxpayerType]}{" "}
              <Link href="/landlord/settings" className="font-medium underline hover:no-underline">
                Change filing type in Settings
              </Link>
              .
            </>
          ) : (
            "Individual and company/trust landlords are taxed under different URA rules — confirm with each property owner which applies before using these figures to file."
          )}
        </p>
      </Card>

      <div className={`grid grid-cols-1 gap-4 ${summary.netByCurrency.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {summary.netByCurrency.length === 0 && (
          <Card>
            <p className="text-sm text-slate-500">No rental income or expenses recorded for this tax year yet.</p>
          </Card>
        )}
        {summary.netByCurrency.map((row) => (
          <Card key={row.currency}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{row.currency}</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Gross rental income received</span>
                <span className="font-medium text-slate-900">
                  {formatMoney(row.income, row.currency as Currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recorded expenses</span>
                <span className="font-medium text-slate-900">
                  {formatMoney(row.expenses, row.currency as Currency)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2">
                <span className="font-medium text-slate-700">Net rental income</span>
                <span className="font-semibold text-ivy-700">{formatMoney(row.net, row.currency as Currency)}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {summary.expensesByCategory.length > 0 && (
        <Card className="mt-6">
          <h2 className="mb-3 text-sm font-medium text-slate-900">Expenses by category</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2 font-medium">Category</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 [&>tr:nth-child(even)]:bg-slate-50">
              {summary.expensesByCategory.map((row) => (
                <tr key={row.category}>
                  <td className="py-2 text-slate-900">{CATEGORY_LABELS[row.category] ?? row.category}</td>
                  <td className="py-2 text-right text-slate-600">
                    {row.amounts.map((a) => formatMoney(a.amount, a.currency as Currency)).join(" + ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-slate-900">Rental income by property</h2>
        {summary.incomeByProperty.length === 0 ? (
          <p className="text-sm text-slate-500">No rental income recorded for this tax year yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2 font-medium">Property</th>
                <th className="py-2 text-right font-medium">Income received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 [&>tr:nth-child(even)]:bg-slate-50">
              {summary.incomeByProperty.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 text-slate-900">{p.name}</td>
                  <td className="py-2 text-right text-slate-600">
                    {p.amounts.map((a) => formatMoney(a.amount, a.currency as Currency)).join(" + ")}
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
