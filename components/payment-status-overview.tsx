import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { invoiceDisplayStatus } from "@/lib/invoice-status";
import { invoiceTotalDue } from "@/lib/invoice-total";
import { SendReminderButton } from "@/components/forms/send-reminder-button";
import type { getLandlordTenants } from "@/lib/data";

const STATUS_TONE = {
  PAID: "green",
  PARTIAL: "amber",
  OVERDUE: "red",
  PENDING: "slate",
} as const;

type Lease = Awaited<ReturnType<typeof getLandlordTenants>>[number];

export function PaymentStatusOverview({ leases, leaseHrefPrefix }: { leases: Lease[]; leaseHrefPrefix: string }) {
  const active = leases.filter((l) => l.status === "ACTIVE");

  const rows = active
    .map((lease) => {
      const current = [...lease.invoices].sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime())[0];
      if (!current) return null;
      const paid = current.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const remaining = invoiceTotalDue(current) - paid;
      return { lease, invoice: current, status: invoiceDisplayStatus(current), remaining };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => {
      const order = { OVERDUE: 0, PARTIAL: 1, PENDING: 2, PAID: 3 };
      return order[a.status] - order[b.status];
    });

  if (rows.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-500">No active tenants yet.</p>
      </Card>
    );
  }

  const paidCount = rows.filter((r) => r.status === "PAID").length;

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-sm">
        <span className="font-medium text-slate-900">This period</span>
        <span className="text-slate-500">
          {paidCount} of {rows.length} tenants paid up
        </span>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <th className="px-4 py-2 font-medium">Tenant</th>
            <th className="px-4 py-2 font-medium">Property / Unit</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Balance</th>
            <th className="px-4 py-2" />
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(({ lease, invoice, status, remaining }) => (
            <tr key={lease.id}>
              <td className="px-4 py-2 text-slate-900">{lease.tenant.name}</td>
              <td className="px-4 py-2 text-slate-600">
                {lease.unit.property.name} — {lease.unit.label}
              </td>
              <td className="px-4 py-2">
                <Badge tone={STATUS_TONE[status]}>{status}</Badge>
              </td>
              <td className={`px-4 py-2 ${remaining > 0 ? "text-red-700" : "text-slate-600"}`}>
                {formatMoney(Math.max(remaining, 0), invoice.currency)}
              </td>
              <td className="px-4 py-2">
                {status !== "PAID" && <SendReminderButton invoiceId={invoice.id} />}
              </td>
              <td className="px-4 py-2 text-right">
                <Link
                  href={`${leaseHrefPrefix}/${lease.id}`}
                  className="font-medium text-ivy-700 hover:text-ivy-800"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
