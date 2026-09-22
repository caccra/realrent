import { describe, expect, it } from "vitest";
import { isInvoiceOverdue, isInvoiceDueSoon, invoiceDisplayStatus } from "@/lib/invoice-status";

const DAY = 24 * 60 * 60 * 1000;

describe("isInvoiceOverdue", () => {
  it("is false for a paid invoice even if the due date has passed", () => {
    expect(isInvoiceOverdue({ status: "PAID", dueDate: new Date(Date.now() - DAY) })).toBe(false);
  });

  it("is true for an unpaid invoice past its due date", () => {
    expect(isInvoiceOverdue({ status: "PENDING", dueDate: new Date(Date.now() - DAY) })).toBe(true);
  });

  it("is false for an unpaid invoice not yet due", () => {
    expect(isInvoiceOverdue({ status: "PENDING", dueDate: new Date(Date.now() + DAY) })).toBe(false);
  });
});

describe("isInvoiceDueSoon", () => {
  it("is false for a paid invoice", () => {
    expect(isInvoiceDueSoon({ status: "PAID", dueDate: new Date(Date.now() + DAY) })).toBe(false);
  });

  it("is false for an already-overdue invoice", () => {
    expect(isInvoiceDueSoon({ status: "PENDING", dueDate: new Date(Date.now() - DAY) })).toBe(false);
  });

  it("is true when due within the window (default 7 days)", () => {
    expect(isInvoiceDueSoon({ status: "PENDING", dueDate: new Date(Date.now() + 3 * DAY) })).toBe(true);
  });

  it("is false when due beyond the window", () => {
    expect(isInvoiceDueSoon({ status: "PENDING", dueDate: new Date(Date.now() + 10 * DAY) })).toBe(false);
  });

  it("respects a custom window", () => {
    expect(isInvoiceDueSoon({ status: "PENDING", dueDate: new Date(Date.now() + 2 * DAY) }, 1)).toBe(false);
  });
});

describe("invoiceDisplayStatus", () => {
  it("returns PAID when status is PAID, regardless of due date", () => {
    expect(invoiceDisplayStatus({ status: "PAID", dueDate: new Date(Date.now() - DAY) })).toBe("PAID");
  });

  it("returns OVERDUE for an unpaid invoice past due, even if status is PARTIAL", () => {
    expect(invoiceDisplayStatus({ status: "PARTIAL", dueDate: new Date(Date.now() - DAY) })).toBe("OVERDUE");
  });

  it("returns PARTIAL for a not-yet-due partially paid invoice", () => {
    expect(invoiceDisplayStatus({ status: "PARTIAL", dueDate: new Date(Date.now() + DAY) })).toBe("PARTIAL");
  });

  it("returns PENDING for a not-yet-due unpaid invoice", () => {
    expect(invoiceDisplayStatus({ status: "PENDING", dueDate: new Date(Date.now() + DAY) })).toBe("PENDING");
  });
});
