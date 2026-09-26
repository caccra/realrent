import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    payment: { create: vi.fn(), findFirst: vi.fn() },
    receipt: { create: vi.fn() },
    rentInvoice: { findUnique: vi.fn(), update: vi.fn() },
    notification: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(), emailLayout: vi.fn(() => "<html></html>") }));
vi.mock("@/lib/audit-log", () => ({ logAudit: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { finalizeFlutterwaveTransaction } from "@/lib/flutterwave";

const INVOICE_ID = "clxinvoice1abc";
const TX_ID = "998877";

function verifyResponse(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    ok: true,
    json: async () => ({
      status: "success",
      data: {
        id: Number(TX_ID),
        status: "successful",
        amount: 500000,
        currency: "UGX",
        tx_ref: `RR-INV-${INVOICE_ID}-1737500000000`,
        ...overrides,
      },
    }),
  };
}

function baseInvoice(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: INVOICE_ID,
    status: "PENDING",
    amountDue: 500000,
    lateFeeAmount: 0,
    currency: "UGX",
    payments: [],
    lease: {
      tenantId: "tenant-1",
      tenant: { name: "Tenant One", email: "tenant@example.com" },
      unit: { label: "A1", property: { name: "Kololo Heights", landlordId: "landlord-1" } },
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("FLUTTERWAVE_SECRET_KEY", "test-secret-key");
  vi.mocked(prisma.$transaction).mockImplementation((fn: unknown) =>
    (fn as (tx: unknown) => Promise<unknown>)(prisma)
  );
  vi.mocked(prisma.payment.findFirst).mockResolvedValue(null);
});

describe("finalizeFlutterwaveTransaction", () => {
  it("fails when Flutterwave verification doesn't succeed", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
    const result = await finalizeFlutterwaveTransaction(TX_ID);
    expect(result).toEqual({ ok: false, reason: "verify-failed" });
  });

  it("does not credit a payment when the transaction status isn't successful", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(verifyResponse({ status: "failed" })));
    const result = await finalizeFlutterwaveTransaction(TX_ID);
    expect(result.ok).toBe(false);
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it("rejects a tx_ref it doesn't recognize", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(verifyResponse({ tx_ref: "SOMETHING-ELSE-123" })));
    const result = await finalizeFlutterwaveTransaction(TX_ID);
    expect(result).toEqual({ ok: false, reason: "unrecognized-tx-ref" });
  });

  it("is idempotent — a transaction already recorded as a Payment is not credited twice", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(verifyResponse()));
    vi.mocked(prisma.payment.findFirst).mockResolvedValue({ id: "existing-payment" } as never);

    const result = await finalizeFlutterwaveTransaction(TX_ID);

    expect(result).toEqual({ ok: true, invoiceId: INVOICE_ID, alreadyProcessed: true });
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it("does not double-credit an invoice that's already PAID", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(verifyResponse()));
    vi.mocked(prisma.rentInvoice.findUnique).mockResolvedValue(baseInvoice({ status: "PAID" }) as never);

    const result = await finalizeFlutterwaveTransaction(TX_ID);

    expect(result).toEqual({ ok: true, invoiceId: INVOICE_ID, alreadyProcessed: true });
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it("credits the amount Flutterwave verified, not anything client-supplied, and marks PAID", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(verifyResponse({ amount: 500000, currency: "UGX" })));
    vi.mocked(prisma.rentInvoice.findUnique).mockResolvedValue(baseInvoice() as never);
    vi.mocked(prisma.payment.create).mockResolvedValue({ id: "payment-1" } as never);
    vi.mocked(prisma.receipt.create).mockResolvedValue({ id: "receipt-1", receiptNumber: "RCT-X-1234" } as never);

    const result = await finalizeFlutterwaveTransaction(TX_ID);

    expect(result).toEqual({ ok: true, invoiceId: INVOICE_ID });
    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: 500000,
          currency: "UGX",
          method: "MOBILE_MONEY",
          provider: "flutterwave",
          providerRef: TX_ID,
        }),
      })
    );
    expect(prisma.rentInvoice.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: "PAID" } }));
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: "PAYMENT_RECEIVED", userId: "landlord-1" }) })
    );
  });

  it("marks the invoice PARTIAL when the verified amount doesn't cover the full balance", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(verifyResponse({ amount: 200000 })));
    vi.mocked(prisma.rentInvoice.findUnique).mockResolvedValue(baseInvoice() as never);
    vi.mocked(prisma.payment.create).mockResolvedValue({ id: "payment-1" } as never);
    vi.mocked(prisma.receipt.create).mockResolvedValue({ id: "receipt-1", receiptNumber: "RCT-X-1234" } as never);

    await finalizeFlutterwaveTransaction(TX_ID);

    expect(prisma.rentInvoice.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: "PARTIAL" } }));
  });
});
