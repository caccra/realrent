import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    lease: { findUnique: vi.fn(), update: vi.fn() },
    unit: { update: vi.fn() },
    property: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/audit-log", () => ({ logAudit: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { PATCH } from "@/app/api/leases/[id]/route";

const LANDLORD_ID = "landlord-1";
const PROPERTY_ID = "property-1";

function mockSession(userId: string | null, role = "LANDLORD") {
  vi.mocked(getServerSession).mockResolvedValue(userId ? ({ user: { id: userId, role } } as never) : null);
}

function baseLease(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "lease-1",
    unitId: "unit-1",
    status: "ACTIVE",
    startDate: new Date("2026-01-01"),
    depositAmount: 300000,
    depositRefundAmount: null,
    depositRefundedAt: null,
    unit: { propertyId: PROPERTY_ID, property: { id: PROPERTY_ID } },
    ...overrides,
  };
}

function request(body: unknown) {
  return new Request("http://localhost/api/leases/lease-1", { method: "PATCH", body: JSON.stringify(body) });
}

const ctx = { params: Promise.resolve({ id: "lease-1" }) };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as never);
  vi.mocked(prisma.property.findUnique).mockResolvedValue({ landlordId: LANDLORD_ID } as never);
});

describe("PATCH /api/leases/[id] — end action", () => {
  it("rejects an unauthenticated request", async () => {
    mockSession(null);
    const res = await PATCH(request({ action: "end" }), ctx);
    expect(res.status).toBe(401);
  });

  it("returns 404 when the caller doesn't manage this lease's property", async () => {
    mockSession(LANDLORD_ID);
    vi.mocked(prisma.lease.findUnique).mockResolvedValue(baseLease() as never);
    vi.mocked(prisma.property.findUnique).mockResolvedValue({ landlordId: "someone-else" } as never);
    const res = await PATCH(request({ action: "end" }), ctx);
    expect(res.status).toBe(404);
  });

  it("rejects ending a lease that isn't ACTIVE", async () => {
    mockSession(LANDLORD_ID);
    vi.mocked(prisma.lease.findUnique).mockResolvedValue(baseLease({ status: "ENDED" }) as never);
    const res = await PATCH(request({ action: "end" }), ctx);
    expect(res.status).toBe(409);
  });

  it("ends the lease, frees the unit, and computes the deposit refund net of deductions", async () => {
    mockSession(LANDLORD_ID);
    vi.mocked(prisma.lease.findUnique).mockResolvedValue(baseLease() as never);

    const res = await PATCH(request({ action: "end", depositDeductions: 50000 }), ctx);

    expect(res.status).toBe(200);
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(prisma.lease.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "ENDED", depositDeductions: 50000, depositRefundAmount: 250000 }),
      })
    );
    expect(prisma.unit.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "VACANT" } })
    );
  });

  it("never lets the refund amount go negative when deductions exceed the deposit", async () => {
    mockSession(LANDLORD_ID);
    vi.mocked(prisma.lease.findUnique).mockResolvedValue(baseLease() as never);

    await PATCH(request({ action: "end", depositDeductions: 999999999 }), ctx);

    expect(prisma.lease.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ depositRefundAmount: 0 }) })
    );
  });
});

describe("PATCH /api/leases/[id] — set-end-date action", () => {
  it("rejects an end date on or before the lease start date", async () => {
    mockSession(LANDLORD_ID);
    vi.mocked(prisma.lease.findUnique).mockResolvedValue(baseLease() as never);
    const res = await PATCH(request({ action: "set-end-date", endDate: "2025-12-01" }), ctx);
    expect(res.status).toBe(400);
  });

  it("rejects changing the end date on a lease that isn't ACTIVE", async () => {
    mockSession(LANDLORD_ID);
    vi.mocked(prisma.lease.findUnique).mockResolvedValue(baseLease({ status: "ENDED" }) as never);
    const res = await PATCH(request({ action: "set-end-date", endDate: "2026-06-01" }), ctx);
    expect(res.status).toBe(409);
  });

  it("accepts a valid future end date", async () => {
    mockSession(LANDLORD_ID);
    vi.mocked(prisma.lease.findUnique).mockResolvedValue(baseLease() as never);
    const res = await PATCH(request({ action: "set-end-date", endDate: "2026-06-01" }), ctx);
    expect(res.status).toBe(200);
    expect(prisma.lease.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { endDate: new Date("2026-06-01") } })
    );
  });
});

describe("PATCH /api/leases/[id] — mark-refunded action", () => {
  it("rejects marking a refund before the lease has ended", async () => {
    mockSession(LANDLORD_ID);
    vi.mocked(prisma.lease.findUnique).mockResolvedValue(baseLease({ status: "ACTIVE" }) as never);
    const res = await PATCH(request({ action: "mark-refunded" }), ctx);
    expect(res.status).toBe(409);
  });

  it("rejects marking a refund twice", async () => {
    mockSession(LANDLORD_ID);
    vi.mocked(prisma.lease.findUnique).mockResolvedValue(
      baseLease({ status: "ENDED", depositRefundAmount: 250000, depositRefundedAt: new Date() }) as never
    );
    const res = await PATCH(request({ action: "mark-refunded" }), ctx);
    expect(res.status).toBe(409);
  });

  it("marks the deposit refunded when eligible", async () => {
    mockSession(LANDLORD_ID);
    vi.mocked(prisma.lease.findUnique).mockResolvedValue(
      baseLease({ status: "ENDED", depositRefundAmount: 250000, depositRefundedAt: null }) as never
    );
    const res = await PATCH(request({ action: "mark-refunded" }), ctx);
    expect(res.status).toBe(200);
    expect(prisma.lease.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ depositRefundedAt: expect.any(Date) }) })
    );
  });
});

describe("PATCH /api/leases/[id] — unsupported action", () => {
  it("returns 400 for an unrecognized action", async () => {
    mockSession(LANDLORD_ID);
    vi.mocked(prisma.lease.findUnique).mockResolvedValue(baseLease() as never);
    const res = await PATCH(request({ action: "nonsense" }), ctx);
    expect(res.status).toBe(400);
  });
});
