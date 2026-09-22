import { Card } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { buildLeaseLedger } from "@/lib/lease-ledger";

type Invoice = Parameters<typeof buildLeaseLedger>[0][number];

export function LeaseLedgerView({ invoices }: { invoices: Invoice[] }) {
  const entries = buildLeaseLedger(invoices);
  const currentBalance = entries.length > 0 ? entries[entries.length - 1].balance : 0;
  const currency = entries.length > 0 ? entries[entries.length - 1].currency : "UGX";

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-900">Ledger</h2>
        <span className={`text-sm font-semibold ${currentBalance > 0 ? "text-red-700" : "text-emerald-700"}`}>
          {currentBalance > 0 ? `Owes ${formatMoney(currentBalance, currency)}` : "Paid up"}
        </span>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">No activity yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-1 font-medium">Date</th>
                <th className="py-1 font-medium">Description</th>
                <th className="py-1 text-right font-medium">Debit</th>
                <th className="py-1 text-right font-medium">Credit</th>
                <th className="py-1 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="py-1.5 text-slate-500">
                    {new Date(entry.date).toLocaleDateString("en-UG")}
                  </td>
                  <td className="py-1.5 text-slate-700">{entry.description}</td>
                  <td className="py-1.5 text-right text-slate-700">
                    {entry.debit > 0 ? formatMoney(entry.debit, entry.currency) : "—"}
                  </td>
                  <td className="py-1.5 text-right text-slate-700">
                    {entry.credit > 0 ? formatMoney(entry.credit, entry.currency) : "—"}
                  </td>
                  <td
                    className={`py-1.5 text-right font-medium ${
                      entry.balance > 0 ? "text-red-700" : "text-slate-900"
                    }`}
                  >
                    {formatMoney(entry.balance, entry.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
