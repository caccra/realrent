import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getPropertyMonthlyStatement } from "@/lib/data";
import { Card } from "@/components/ui";
import { formatMoney, type Currency } from "@/lib/money";
import { PrintButton } from "@/components/print-button";
import { canManageProperty } from "@/lib/authorization";

/** Most properties collect a single currency; joins the rare mixed case rather than summing raw numbers. */
function formatByCurrency(entries: { currency: string; amount: number }[]): string {
  if (entries.length === 0) return formatMoney(0, "UGX");
  return entries.map((e) => formatMoney(e.amount, e.currency as Currency)).join(" + ");
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function PropertyStatementPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const user = await requireUser(["LANDLORD", "PROPERTY_MANAGER"]);

  const now = new Date();
  const year = Number(search.year) || now.getFullYear();
  const month = Number(search.month) || now.getMonth() + 1;

  const statement = await getPropertyMonthlyStatement(id, year, month);
  if (!statement || !(await canManageProperty(user.id, user.role, id))) {
    notFound();
  }

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3 text-sm">
          <Link
            href={`/landlord/properties/${id}/statement?year=${prevMonth.year}&month=${prevMonth.month}`}
            className="text-emerald-700 hover:text-emerald-800"
          >
            ← Previous month
          </Link>
          <Link
            href={`/landlord/properties/${id}/statement?year=${nextMonth.year}&month=${nextMonth.month}`}
            className="text-emerald-700 hover:text-emerald-800"
          >
            Next month →
          </Link>
        </div>
        <PrintButton label="Print statement" />
      </div>

      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Landlord Monthly Statement</h1>
            <p className="text-sm text-slate-500">{statement.property.name}</p>
            <p className="text-sm text-slate-500">{statement.property.address}</p>
          </div>
          <p className="text-sm font-medium text-slate-700">
            {MONTH_NAMES[month - 1]} {year}
          </p>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <h2 className="mb-2 text-sm font-medium text-slate-900">Income</h2>
          <Row label="Expected rent" value={formatByCurrency(statement.expectedRentByCurrency)} />
          <Row label="Collected" value={formatByCurrency(statement.collectedByCurrency)} />
          <Row
            label="Outstanding"
            value={formatByCurrency(statement.outstandingByCurrency)}
            tone={statement.outstandingByCurrency.some((e) => e.amount > 0) ? "red" : undefined}
          />
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <h2 className="mb-2 text-sm font-medium text-slate-900">Expenses</h2>
          <Row label="Maintenance (UGX)" value={formatMoney(statement.maintenanceCost, "UGX")} />
        </div>

        <div className="mt-4 border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-900">Net income</span>
            <span className="text-xl font-semibold text-emerald-700">
              {formatByCurrency(statement.netIncomeByCurrency)}
            </span>
          </div>
        </div>
      </Card>

      {statement.payments.length > 0 && (
        <Card className="mt-6">
          <h2 className="mb-3 text-sm font-medium text-slate-900">Payments this period</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-1 font-medium">Date</th>
                <th className="py-1 font-medium">Tenant</th>
                <th className="py-1 font-medium">Unit</th>
                <th className="py-1 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {statement.payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-1.5 text-slate-500">{new Date(p.paidAt).toLocaleDateString("en-UG")}</td>
                  <td className="py-1.5 text-slate-700">{p.invoice.lease.tenant.name}</td>
                  <td className="py-1.5 text-slate-700">{p.invoice.lease.unit.label}</td>
                  <td className="py-1.5 text-right text-slate-900">
                    {formatMoney(p.amount.toString(), p.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {statement.maintenance.length > 0 && (
        <Card className="mt-6">
          <h2 className="mb-3 text-sm font-medium text-slate-900">Completed maintenance this period</h2>
          <ul className="space-y-2 text-sm">
            {statement.maintenance.map((m) => (
              <li key={m.id} className="flex items-center justify-between">
                <span className="text-slate-700">
                  {m.title}
                  {m.vendor && ` — ${m.vendor}`}
                </span>
                <span className="text-slate-900">{formatMoney(Number(m.cost ?? 0), "UGX")}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "red" }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={tone === "red" ? "font-medium text-red-700" : "text-slate-900"}>{value}</span>
    </div>
  );
}
