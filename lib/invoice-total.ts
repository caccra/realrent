/** Total owed on an invoice, including any late fee applied by the rent cycle job. */
export function invoiceTotalDue(invoice: { amountDue: unknown; lateFeeAmount?: unknown }): number {
  return Number(invoice.amountDue) + Number(invoice.lateFeeAmount ?? 0);
}
