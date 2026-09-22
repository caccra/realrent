import { describe, expect, it } from "vitest";
import { addBillingCycle, firstInvoicePeriod, nextInvoicePeriod, generateReceiptNumber } from "@/lib/invoicing";

describe("addBillingCycle", () => {
  it("advances a month for MONTHLY", () => {
    const result = addBillingCycle(new Date("2026-01-15T00:00:00.000Z"), "MONTHLY");
    expect(result.toISOString()).toBe("2026-02-15T00:00:00.000Z");
  });

  it("advances three months for QUARTERLY", () => {
    const result = addBillingCycle(new Date("2026-01-15T00:00:00.000Z"), "QUARTERLY");
    expect(result.toISOString()).toBe("2026-04-15T00:00:00.000Z");
  });

  it("advances a year for ANNUAL", () => {
    const result = addBillingCycle(new Date("2026-01-15T00:00:00.000Z"), "ANNUAL");
    expect(result.toISOString()).toBe("2027-01-15T00:00:00.000Z");
  });

  it("does not mutate the input date", () => {
    const original = new Date("2026-01-15T00:00:00.000Z");
    addBillingCycle(original, "MONTHLY");
    expect(original.toISOString()).toBe("2026-01-15T00:00:00.000Z");
  });
});

describe("firstInvoicePeriod", () => {
  it("starts the period on the lease start date, with due date equal to period start", () => {
    const start = new Date("2026-03-01T00:00:00.000Z");
    const { periodStart, periodEnd, dueDate } = firstInvoicePeriod(start, "MONTHLY");
    expect(periodStart.toISOString()).toBe("2026-03-01T00:00:00.000Z");
    expect(periodEnd.toISOString()).toBe("2026-04-01T00:00:00.000Z");
    expect(dueDate).toEqual(periodStart);
  });
});

describe("nextInvoicePeriod", () => {
  it("starts where the previous period ended", () => {
    const previousEnd = new Date("2026-04-01T00:00:00.000Z");
    const { periodStart, periodEnd, dueDate } = nextInvoicePeriod(previousEnd, "MONTHLY");
    expect(periodStart.toISOString()).toBe("2026-04-01T00:00:00.000Z");
    expect(periodEnd.toISOString()).toBe("2026-05-01T00:00:00.000Z");
    expect(dueDate).toEqual(periodStart);
  });
});

describe("generateReceiptNumber", () => {
  it("has the RCT- prefix", () => {
    expect(generateReceiptNumber()).toMatch(/^RCT-[A-Z0-9]+-[A-Z0-9]{4}$/);
  });

  it("generates unique values across calls", () => {
    const a = generateReceiptNumber();
    const b = generateReceiptNumber();
    expect(a).not.toBe(b);
  });
});
