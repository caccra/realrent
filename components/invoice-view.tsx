import Link from "next/link";
import { Badge } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { invoiceDisplayStatus } from "@/lib/invoice-status";
import { invoiceTotalDue } from "@/lib/invoice-total";
import { PrintButton } from "@/components/print-button";
import { PayOnlineButton } from "@/components/forms/pay-online-button";
import type { getInvoiceDetail } from "@/lib/data";

const STATUS_TONE = {
  PAID: "green",
  PARTIAL: "amber",
  OVERDUE: "red",
  PENDING: "slate",
} as const;

export function InvoiceView({
  invoice,
  receiptHrefPrefix,
  showPayOnline = false,
}: {
  invoice: NonNullable<Awaited<ReturnType<typeof getInvoiceDetail>>>;
  receiptHrefPrefix: string;
  showPayOnline?: boolean;
}) {
  const { lease } = invoice;
  const status = invoiceDisplayStatus(invoice);
  const totalDue = invoiceTotalDue(invoice);
  const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = Math.max(totalDue - paid, 0);
  const hasLateFee = Number(invoice.lateFeeAmount) > 0;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton label="Print invoice" />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Rent Invoice</h1>
            <p className="mt-1 text-sm text-slate-500">{invoice.invoiceNumber ?? invoice.id}</p>
          </div>
          <Badge tone={STATUS_TONE[status]}>{status}</Badge>
        </div>

        <div className="mt-6 space-y-2 text-sm">
          <Row label="Landlord" value={lease.unit.property.landlord.name} />
          <Row label="Tenant" value={lease.tenant.name} />
          <Row label="Property" value={`${lease.unit.property.name} — ${lease.unit.label}`} />
          <Row
            label="Billing period"
            value={`${new Date(invoice.periodStart).toLocaleDateString("en-UG")} – ${new Date(
              invoice.periodEnd
            ).toLocaleDateString("en-UG")}`}
          />
          <Row label="Due date" value={new Date(invoice.dueDate).toLocaleDateString("en-UG")} />
        </div>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 text-slate-600">Rent</td>
                <td className="py-1 text-right text-slate-900">
                  {formatMoney(invoice.amountDue.toString(), invoice.currency)}
                </td>
              </tr>
              {hasLateFee && (
                <tr>
                  <td className="py-1 text-slate-600">Late fee</td>
                  <td className="py-1 text-right text-slate-900">
                    {formatMoney(invoice.lateFeeAmount.toString(), invoice.currency)}
                  </td>
                </tr>
              )}
              <tr className="border-t border-slate-100">
                <td className="py-2 font-medium text-slate-900">Total due</td>
                <td className="py-2 text-right font-medium text-slate-900">
                  {formatMoney(totalDue, invoice.currency)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {invoice.payments.length > 0 && (
          <div className="mt-6 border-t border-slate-200 pt-4">
            <p className="mb-2 text-sm font-medium text-slate-900">Payments applied</p>
            <ul className="space-y-1 text-sm">
              {invoice.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <span className="text-slate-600">
                    {new Date(p.paidAt).toLocaleDateString("en-UG")} · {p.method}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-slate-900">{formatMoney(p.amount.toString(), p.currency)}</span>
                    {p.receipt && (
                      <Link
                        href={`${receiptHrefPrefix}/${p.receipt.id}`}
                        className="text-xs font-medium text-ivy-700 hover:text-ivy-800 print:hidden"
                      >
                        Receipt →
                      </Link>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-500">{balance > 0 ? "Balance due" : "Balance"}</p>
          <p className={`text-2xl font-semibold ${balance > 0 ? "text-red-700" : "text-slate-900"}`}>
            {formatMoney(balance, invoice.currency)}
          </p>
          {showPayOnline && balance > 0 && (
            <div className="mt-4">
              <PayOnlineButton invoiceId={invoice.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900">{value}</span>
    </div>
  );
}
