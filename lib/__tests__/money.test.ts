import { describe, expect, it } from "vitest";
import { formatUGX } from "@/lib/money";

// Intl.NumberFormat inserts a non-breaking space (U+00A0) between the
// currency symbol and the amount, not a regular space.
const NBSP = " ";

describe("formatUGX", () => {
  it("formats a plain number with no decimals", () => {
    expect(formatUGX(300000)).toBe(`USh${NBSP}300,000`);
  });

  it("formats a numeric string", () => {
    expect(formatUGX("150000")).toBe(`USh${NBSP}150,000`);
  });

  it("formats an object with toString (e.g. Prisma Decimal)", () => {
    expect(formatUGX({ toString: () => "500000" })).toBe(`USh${NBSP}500,000`);
  });

  it("formats zero", () => {
    expect(formatUGX(0)).toBe(`USh${NBSP}0`);
  });
});
