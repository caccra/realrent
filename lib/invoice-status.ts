/**
 * Invoice `status` in the DB only ever moves PENDING -> PARTIAL -> PAID
 * (set explicitly when a payment is recorded). "Overdue" is derived here
 * rather than stored, since there's no background job to flip it yet.
 */
export function isInvoiceOverdue(invoice: { status: string; dueDate: Date | string }): boolean {
  return invoice.status !== "PAID" && new Date(invoice.dueDate) < new Date();
}

export function isInvoiceDueSoon(
  invoice: { status: string; dueDate: Date | string },
  withinDays = 7
): boolean {
  if (invoice.status === "PAID" || isInvoiceOverdue(invoice)) return false;
  const due = new Date(invoice.dueDate);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + withinDays);
  return due <= cutoff;
}

export function invoiceDisplayStatus(invoice: {
  status: string;
  dueDate: Date | string;
}): "PAID" | "PARTIAL" | "OVERDUE" | "PENDING" {
  if (invoice.status === "PAID") return "PAID";
  if (isInvoiceOverdue(invoice)) return "OVERDUE";
  if (invoice.status === "PARTIAL") return "PARTIAL";
  return "PENDING";
}
