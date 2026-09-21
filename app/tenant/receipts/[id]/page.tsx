import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatUGX } from "@/lib/money";
import { PrintButton } from "@/components/print-button";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser("TENANT");

  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: {
      payment: {
        include: {
          invoice: {
            include: {
              lease: {
                include: { tenant: true, unit: { include: { property: { include: { landlord: true } } } } },
              },
            },
          },
        },
      },
    },
  });

  if (!receipt || receipt.payment.invoice.lease.tenantId !== user.id) {
    notFound();
  }

  const { payment } = receipt;
  const { lease } = payment.invoice;

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-8">
        <h1 className="text-xl font-semibold text-slate-900">Rent Receipt</h1>
        <p className="mt-1 text-sm text-slate-500">{receipt.receiptNumber}</p>

        <div className="mt-6 space-y-2 text-sm">
          <Row label="Issued" value={new Date(receipt.issuedAt).toLocaleDateString("en-UG")} />
          <Row label="Landlord" value={lease.unit.property.landlord.name} />
          <Row label="Tenant" value={lease.tenant.name} />
          <Row label="Property" value={`${lease.unit.property.name} — ${lease.unit.label}`} />
          <Row
            label="Rent period"
            value={`${new Date(payment.invoice.periodStart).toLocaleDateString("en-UG")} – ${new Date(
              payment.invoice.periodEnd
            ).toLocaleDateString("en-UG")}`}
          />
          <Row label="Payment method" value={payment.method} />
        </div>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-500">Amount paid</p>
          <p className="text-2xl font-semibold text-slate-900">{formatUGX(payment.amount.toString())}</p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900">{value}</span>
    </div>
  );
}
