import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    rentInvoice: { findUnique: vi.fn(), update: vi.fn() },
    property: { findUnique: vi.fn() },
    payment: { create: vi.fn() },
    receipt: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(), emailLayout: vi.fn(() => "<html></html>") }));
vi.mock("@/lib/audit-log", () => ({ logAudit: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { POST } from "@/app/api/invoices/[id]/pay-cash/route";

const LANDLORD_ID = "landlord-1";
const PROPERTY_ID = "property-1";

function mockSession(userId: string | null, role = "LANDLORD") {
  vi.mocked(getServerSession).mockResolvedValue(
    userId ? ({ user: { id: userId, role } } as never) : null
  );
}

function baseInvoice(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "invoice-1",
    status: "PENDING",
    amountDue: 500000,
    lateFeeAmount: 0,
    currency: "UGX",
    payments: [],
    lease: {
      tenant: { email: "tenant@example.com" },
      unit: { propertyId: PROPERTY_ID, label: "A1", property: { name: "Kololo Heights" } },
    },
    ...overrides,
  };
}

function request(body: unknown) {
  return new Request("http://localhost/api/invoices/invoice-1/pay-cash", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const ctx = { params: Promise.resolve({ id: "invoice-1" }) };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.$transaction).mockImplementation((fn: unknown) =>
    (fn as (tx: unknown) => Promise<unknown>)(prisma)
  );
});

describe("POST /api/invoices/[id]/pay-cash", () => {
  it("rejects an unauthenticated request", async () => {
    mockSession(null);
    const res = await POST(request({ amount: 100 }), ctx);
    expect(res.status).toBe(401);
  });

  it("returns 404 when the invoice doesn't exist", async () => {
    mockSession(LANDLORD_ID);
    vi.mocked(prisma.rentInvoice.findUnique).mockResolvedValue(null);
    const res = await POST(request({ amount: 100 }), ctx);
    expect(res.status).toBe(404);
  });

  it("returns 404 when the landlord doesn't own the invoice's property", async () => {
    mockSession(LANDLORD_ID);
    vi.mocked(prisma.rentInvoice.findUnique).mockResolvedValue(baseInvoice() as never);
    vi.mocked(prisma.property.findUnique).mockResolvedValue({ landlordId: "someone-else" } as never);
    const res = await POST(request({ amount: 100 }), ctx);
    expect(res.status).toBe(404);
  });

  it("rejects with 409 when the invoice is already PAID", async () => {
    mockSession(LANDLORD_ID);
    vi.mocked(prisma.rentInvoice.findUnique).mockResolvedValue(baseInvoice({ status: "PAID" }) as never);
    vi.mocked(prisma.property.findUnique).mockResolvedValue({ landlordId: LANDLORD_ID } as never);
    const res = await POST(request({ amount: 100 }), ctx);
    expect(res.status).toBe(409);
  });

  it("rejects an amount that exceeds the remaining balance", async () => {
    mockSession(LANDLORD_ID);
    vi.mocked(prisma.rentInvoice.findUnique).mockResolvedValue(baseInvoice() as never);
    vi.mocked(prisma.property.findUnique).mockResolvedValue({ landlordId: LANDLORD_ID } as never);
    const res = await POST(request({ amount: 999999999 }), ctx);
    expect(res.status).toBe(400);
  });

  it("rejects a non-positive amount", async () => {
    mockSession(LANDLORD_ID);
    vi.mocked(prisma.rentInvoice.findUnique).mockResolvedValue(baseInvoice() as never);
    vi.mocked(prisma.property.findUnique).mockResolvedValue({ landlordId: LANDLORD_ID } as never);
    const res = await POST(request({ amount: 0 }), ctx);
    expect(res.status).toBe(400);
  });

  it("records a full payment, creates a receipt, and marks the invoice PAID", async () => {
    mockSession(LANDLORD_ID);
    vi.mocked(prisma.rentInvoice.findUnique).mockResolvedValue(baseInvoice() as never);
    vi.mocked(prisma.property.findUnique).mockResolvedValue({ landlordId: LANDLORD_ID } as never);
    vi.mocked(prisma.payment.create).mockResolvedValue({ id: "payment-1" } as never);
    vi.mocked(prisma.receipt.create).mockResolvedValue({ id: "receipt-1", receiptNumber: "RCT-X-1234" } as never);

    const res = await POST(request({ amount: 500000 }), ctx);

    expect(res.status).toBe(200);
    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ amount: 500000, method: "CASH" }) })
    );
    expect(prisma.rentInvoice.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "PAID" } })
    );
  });

  it("marks the invoice PARTIAL when the payment doesn't cover the full balance", async () => {
    mockSession(LANDLORD_ID);
    vi.mocked(prisma.rentInvoice.findUnique).mockResolvedValue(baseInvoice() as never);
    vi.mocked(prisma.property.findUnique).mockResolvedValue({ landlordId: LANDLORD_ID } as never);
    vi.mocked(prisma.payment.create).mockResolvedValue({ id: "payment-1" } as never);
    vi.mocked(prisma.receipt.create).mockResolvedValue({ id: "receipt-1", receiptNumber: "RCT-X-1234" } as never);

    const res = await POST(request({ amount: 200000 }), ctx);

    expect(res.status).toBe(200);
    expect(prisma.rentInvoice.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "PARTIAL" } })
    );
  });
});
