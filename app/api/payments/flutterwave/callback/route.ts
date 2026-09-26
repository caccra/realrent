import { NextResponse } from "next/server";
import { finalizeFlutterwaveTransaction } from "@/lib/flutterwave";
import { withErrorHandling } from "@/lib/api-handler";

/**
 * Flutterwave redirects the tenant's browser here after a checkout attempt.
 * This is a UX convenience only — it re-verifies against Flutterwave's API
 * before crediting anything (never trusts these query params) and the
 * webhook below is the authoritative, reliable path if the browser never
 * makes it back (closed tab, network drop mid-redirect).
 */
export const GET = withErrorHandling(async (request) => {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const transactionId = url.searchParams.get("transaction_id");
  const appUrl = process.env.NEXTAUTH_URL || "https://realrent-lime.vercel.app";

  if (status === "cancelled" || !transactionId) {
    return NextResponse.redirect(`${appUrl}/tenant/dashboard?payment=cancelled`);
  }

  const result = await finalizeFlutterwaveTransaction(transactionId);
  if (!result.ok) {
    return NextResponse.redirect(`${appUrl}/tenant/dashboard?payment=failed`);
  }

  return NextResponse.redirect(`${appUrl}/tenant/invoices/${result.invoiceId}?payment=success`);
});
