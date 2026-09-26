import Link from "next/link";
import { SearchFilterBox } from "@/components/search-filter-box";
import { Badge, Card } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import type { getLandlordPayments } from "@/lib/data";

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  MOBILE_MONEY: "Mobile Money",
  BANK: "Bank transfer",
};

const STATUS_TONE = {
  SUCCESSFUL: "green",
  PENDING: "amber",
  FAILED: "red",
} as const;

type Payment = Awaited<ReturnType<typeof getLandlordPayments>>[number];

export function PaymentsLedger({ payments, leaseHrefPrefix }: { payments: Payment[]; leaseHrefPrefix: string }) {
  if (payments.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-500">No payments recorded yet.</p>
      </Card>
    );
  }

  return (
    <>
      <SearchFilterBox containerId="payments-table-body" placeholder="Search by tenant or property…" />
      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Tenant</th>
              <th className="px-4 py-2 font-medium">Property / Unit</th>
              <th className="px-4 py-2 font-medium">Method</th>
              <th className="px-4 py-2 font-medium">Amount</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody id="payments-table-body" className="divide-y divide-slate-100">
            {payments.map((p) => {
              const lease = p.invoice.lease;
              return (
                <tr
                  key={p.id}
                  data-search-text={`${lease.tenant.name} ${lease.unit.property.name} ${lease.unit.label}`.toLowerCase()}
                >
                  <td className="px-4 py-2 text-slate-600">
                    {new Date(p.paidAt).toLocaleDateString("en-UG")}
                  </td>
                  <td className="px-4 py-2 text-slate-900">{lease.tenant.name}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {lease.unit.property.name} — {lease.unit.label}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{METHOD_LABELS[p.method] ?? p.method}</td>
                  <td className="px-4 py-2 text-slate-900">{formatMoney(p.amount.toString(), p.currency)}</td>
                  <td className="px-4 py-2">
                    <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
                    {p.receipt && (
                      <span className="ml-2 text-xs text-slate-400">{p.receipt.receiptNumber}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`${leaseHrefPrefix}/${lease.id}`}
                      className="font-medium text-ivy-700 hover:text-ivy-800"
                    >
                      View lease
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}
