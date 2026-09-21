import type { BillingCycle } from "@prisma/client";

/** Advances a date by one billing period. */
export function addBillingCycle(date: Date, cycle: BillingCycle): Date {
  const next = new Date(date);
  switch (cycle) {
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "QUARTERLY":
      next.setMonth(next.getMonth() + 3);
      break;
    case "ANNUAL":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

/** First invoice period starts on the lease start date. */
export function firstInvoicePeriod(startDate: Date, cycle: BillingCycle) {
  const periodStart = new Date(startDate);
  const periodEnd = addBillingCycle(periodStart, cycle);
  return { periodStart, periodEnd, dueDate: periodStart };
}

/** Next invoice period starts where the previous one ended. */
export function nextInvoicePeriod(previousPeriodEnd: Date, cycle: BillingCycle) {
  const periodStart = new Date(previousPeriodEnd);
  const periodEnd = addBillingCycle(periodStart, cycle);
  return { periodStart, periodEnd, dueDate: periodStart };
}

export function generateReceiptNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RCT-${timestamp}-${random}`;
}
