import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "LANDLORD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payments = await prisma.payment.findMany({
    where: { invoice: { lease: { unit: { property: { landlordId: session.user.id } } } } },
    orderBy: { paidAt: "desc" },
    include: {
      invoice: {
        include: {
          lease: { include: { tenant: true, unit: { include: { property: true } } } },
        },
      },
    },
  });

  const header = ["Date", "Tenant", "Property", "Unit", "Method", "Amount (UGX)", "Status", "Invoice period"];
  const rows = payments.map((p) => [
    p.paidAt.toISOString().slice(0, 10),
    p.invoice.lease.tenant.name,
    p.invoice.lease.unit.property.name,
    p.invoice.lease.unit.label,
    p.method,
    p.amount.toString(),
    p.status,
    `${p.invoice.periodStart.toISOString().slice(0, 10)} to ${p.invoice.periodEnd.toISOString().slice(0, 10)}`,
  ]);

  const csv = [header, ...rows].map((row) => row.map((c) => csvCell(String(c))).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="payments-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
