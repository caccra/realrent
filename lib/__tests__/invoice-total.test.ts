import { describe, expect, it } from "vitest";
import { invoiceTotalDue } from "@/lib/invoice-total";

describe("invoiceTotalDue", () => {
  it("adds a late fee to the base amount due", () => {
    expect(invoiceTotalDue({ amountDue: 300000, lateFeeAmount: 5000 })).toBe(305000);
  });

  it("treats a missing late fee as zero", () => {
    expect(invoiceTotalDue({ amountDue: 300000 })).toBe(300000);
  });

  it("coerces string/Decimal-like values", () => {
    expect(invoiceTotalDue({ amountDue: "300000", lateFeeAmount: "5000" })).toBe(305000);
  });

  it("handles a zero-valued late fee explicitly", () => {
    expect(invoiceTotalDue({ amountDue: 300000, lateFeeAmount: 0 })).toBe(300000);
  });
});
