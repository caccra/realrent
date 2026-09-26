import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invoiceTotalDue } from "@/lib/invoice-total";
import { initiateFlutterwavePayment, isFlutterwaveConfigured } from "@/lib/flutterwave";
import { withErrorHandling } from "@/lib/api-handler";

export const POST = withErrorHandling(async (_request, { params }) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoice = await prisma.rentInvoice.findUnique({
    where: { id },
    include: {
      lease: { include: { tenant: true, unit: { include: { property: true } } } },
      payments: true,
    },
  });

  if (!invoice || invoice.lease.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (invoice.status === "PAID") {
    return NextResponse.json({ error: "This invoice is already fully paid" }, { status: 409 });
  }
  if (!isFlutterwaveConfigured()) {
    return NextResponse.json(
      { error: "Online payment isn't set up yet. Please pay via the landlord's Mobile Money number instead." },
      { status: 503 }
    );
  }

  const alreadyPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = Math.max(invoiceTotalDue(invoice) - alreadyPaid, 0);
  if (balance <= 0) {
    return NextResponse.json({ error: "There is no remaining balance on this invoice" }, { status: 409 });
  }

  const appUrl = process.env.NEXTAUTH_URL || "https://realrent-lime.vercel.app";
  const result = await initiateFlutterwavePayment({
    invoiceId: invoice.id,
    amount: balance,
    currency: invoice.currency,
    customerEmail: invoice.lease.tenant.email,
    customerPhone: invoice.lease.tenant.phone,
    customerName: invoice.lease.tenant.name,
    redirectUrl: `${appUrl}/api/payments/flutterwave/callback`,
  });

  if (!result || "error" in result) {
    return NextResponse.json(
      { error: result?.error ?? "Online payment isn't available right now." },
      { status: 502 }
    );
  }

  return NextResponse.json({ link: result.link });
});
