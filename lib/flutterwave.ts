import { prisma } from "@/lib/prisma";
import { generateReceiptNumber } from "@/lib/invoicing";
import { invoiceTotalDue } from "@/lib/invoice-total";
import { logAudit } from "@/lib/audit-log";
import { emailLayout, sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { formatMoney } from "@/lib/money";

const FLUTTERWAVE_API = "https://api.flutterwave.com/v3";
const TX_REF_PREFIX = "RR-INV-";

function isConfigured(): boolean {
  return Boolean(process.env.FLUTTERWAVE_SECRET_KEY);
}

function txRefFor(invoiceId: string): string {
  return `${TX_REF_PREFIX}${invoiceId}-${Date.now()}`;
}

function invoiceIdFromTxRef(txRef: string): string | null {
  if (!txRef.startsWith(TX_REF_PREFIX)) return null;
  const rest = txRef.slice(TX_REF_PREFIX.length);
  const lastDash = rest.lastIndexOf("-");
  if (lastDash === -1) return null;
  return rest.slice(0, lastDash);
}

/**
 * Asks Flutterwave for a hosted checkout link for this invoice's remaining
 * balance. Returns null (not throwing) if Flutterwave isn't configured yet,
 * so callers can show a friendly "online payment isn't set up" message
 * instead of crashing — same fail-safe pattern as lib/email.ts.
 */
export async function initiateFlutterwavePayment(params: {
  invoiceId: string;
  amount: number;
  currency: "UGX" | "USD";
  customerEmail: string | null;
  customerPhone: string | null;
  customerName: string;
  redirectUrl: string;
}): Promise<{ link: string } | { error: string } | null> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) return null;

  const response = await fetch(`${FLUTTERWAVE_API}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: txRefFor(params.invoiceId),
      amount: params.amount,
      currency: params.currency,
      redirect_url: params.redirectUrl,
      customer: {
        email: params.customerEmail || "no-reply@realrent.app",
        phonenumber: params.customerPhone || undefined,
        name: params.customerName,
      },
      customizations: {
        title: "Kezavi — Rent payment",
        description: "Rent invoice payment",
      },
    }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || body?.status !== "success" || !body?.data?.link) {
    console.error("[flutterwave] Failed to initiate payment:", body);
    return { error: body?.message ?? "Could not start the payment. Please try again." };
  }

  return { link: body.data.link as string };
}

type VerifiedTransaction = {
  id: number;
  status: string;
  amount: number;
  currency: string;
  txRef: string;
};

async function verifyTransaction(transactionId: string): Promise<VerifiedTransaction | null> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) return null;

  const response = await fetch(`${FLUTTERWAVE_API}/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.status !== "success" || !body?.data) {
    console.error("[flutterwave] Failed to verify transaction:", transactionId, body);
    return null;
  }

  return {
    id: body.data.id,
    status: body.data.status,
    amount: Number(body.data.amount),
    currency: body.data.currency,
    txRef: body.data.tx_ref,
  };
}

export type FinalizeResult =
  | { ok: true; invoiceId: string; alreadyProcessed?: boolean }
  | { ok: false; reason: string; invoiceId?: string };

/**
 * The single source of truth for crediting a Flutterwave payment. Called
 * from both the browser-redirect callback and the server-to-server webhook
 * — either path can arrive first, so this always re-verifies against
 * Flutterwave's API (never trusts client-supplied amount/status) and is
 * idempotent on Payment.providerRef so a retry never double-credits.
 */
export async function finalizeFlutterwaveTransaction(transactionId: string): Promise<FinalizeResult> {
  const verified = await verifyTransaction(transactionId);
  if (!verified) return { ok: false, reason: "verify-failed" };

  const invoiceId = invoiceIdFromTxRef(verified.txRef);
  if (!invoiceId) return { ok: false, reason: "unrecognized-tx-ref" };

  if (verified.status !== "successful") {
    return { ok: false, reason: `transaction-${verified.status}`, invoiceId };
  }

  const existing = await prisma.payment.findFirst({ where: { providerRef: String(verified.id) } });
  if (existing) return { ok: true, invoiceId, alreadyProcessed: true };

  const invoice = await prisma.rentInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      lease: { include: { tenant: true, unit: { include: { property: true } } } },
      payments: true,
    },
  });
  if (!invoice) return { ok: false, reason: "invoice-not-found" };
  if (invoice.status === "PAID") return { ok: true, invoiceId, alreadyProcessed: true };

  const alreadyPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const amountDue = invoiceTotalDue(invoice);
  const newTotal = alreadyPaid + verified.amount;

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: verified.amount,
        currency: verified.currency as "UGX" | "USD",
        method: "MOBILE_MONEY",
        provider: "flutterwave",
        providerRef: String(verified.id),
        status: "SUCCESSFUL",
      },
    });

    const receipt = await tx.receipt.create({
      data: { paymentId: payment.id, receiptNumber: generateReceiptNumber() },
    });

    await tx.rentInvoice.update({
      where: { id: invoice.id },
      data: { status: newTotal >= amountDue ? "PAID" : "PARTIAL" },
    });

    return { payment, receipt };
  });

  await logAudit({
    userId: invoice.lease.tenantId,
    action: "payment.mobile-money",
    targetType: "Payment",
    targetId: result.payment.id,
    metadata: { invoiceId: invoice.id, amount: verified.amount, provider: "flutterwave" },
  });

  await sendEmail({
    to: invoice.lease.tenant.email,
    subject: "Payment received — receipt attached",
    html: emailLayout(
      "Payment received",
      `<p>We've received your Mobile Money payment of <strong>${formatMoney(
        verified.amount,
        verified.currency as "UGX" | "USD"
      )}</strong> for ${invoice.lease.unit.property.name} — ${invoice.lease.unit.label}.</p>
       <p>Receipt number: <strong>${result.receipt.receiptNumber}</strong></p>`,
      `/tenant/receipts/${result.receipt.id}`,
      "View receipt"
    ),
  });

  await sendSms({
    to: invoice.lease.tenant.phone,
    message: `Kezavi: Mobile Money payment of ${formatMoney(verified.amount, verified.currency as "UGX" | "USD")} received for ${invoice.lease.unit.property.name} - ${invoice.lease.unit.label}. Receipt: ${result.receipt.receiptNumber}.`,
  });

  await prisma.notification.create({
    data: {
      userId: invoice.lease.unit.property.landlordId,
      type: "PAYMENT_RECEIVED",
      title: "Rent payment received",
      message: `${invoice.lease.tenant.name} paid ${formatMoney(
        verified.amount,
        verified.currency as "UGX" | "USD"
      )} via Mobile Money for ${invoice.lease.unit.property.name} — ${invoice.lease.unit.label}.`,
      link: `/landlord/invoices/${invoice.id}`,
    },
  });

  return { ok: true, invoiceId };
}

export { isConfigured as isFlutterwaveConfigured };
