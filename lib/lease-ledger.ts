type Payment = {
  id: string;
  amount: unknown;
  method: string;
  paidAt: Date;
};

type Invoice = {
  id: string;
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  amountDue: unknown;
  currency: "UGX" | "USD";
  lateFeeAmount: unknown;
  payments: Payment[];
};

export type LedgerEntry = {
  id: string;
  date: Date;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  currency: "UGX" | "USD";
};

/**
 * Flattens a lease's invoices/payments into a chronological running-balance
 * ledger — the "am I paid up?" view, rather than an invoice-by-invoice list.
 * A positive balance means the tenant owes that much.
 */
export function buildLeaseLedger(invoices: Invoice[]): LedgerEntry[] {
  type RawEntry = { date: Date; description: string; debit: number; credit: number; currency: "UGX" | "USD" };
  const raw: RawEntry[] = [];

  for (const invoice of invoices) {
    const periodLabel = `${invoice.periodStart.toLocaleDateString("en-UG", {
      month: "short",
      day: "numeric",
    })} – ${invoice.periodEnd.toLocaleDateString("en-UG", { month: "short", day: "numeric", year: "numeric" })}`;

    raw.push({
      date: invoice.dueDate,
      description: `Rent — ${periodLabel}`,
      debit: Number(invoice.amountDue),
      credit: 0,
      currency: invoice.currency,
    });

    if (Number(invoice.lateFeeAmount) > 0) {
      raw.push({
        date: invoice.dueDate,
        description: `Late fee — ${periodLabel}`,
        debit: Number(invoice.lateFeeAmount),
        credit: 0,
        currency: invoice.currency,
      });
    }

    for (const payment of invoice.payments) {
      raw.push({
        date: payment.paidAt,
        description: `Payment via ${payment.method === "MOBILE_MONEY" ? "Mobile Money" : payment.method === "BANK" ? "Bank transfer" : "Cash"}`,
        debit: 0,
        credit: Number(payment.amount),
        currency: invoice.currency,
      });
    }
  }

  raw.sort((a, b) => a.date.getTime() - b.date.getTime());

  let balance = 0;
  return raw.map((entry, i) => {
    balance += entry.debit - entry.credit;
    return { id: `${i}`, ...entry, balance };
  });
}
