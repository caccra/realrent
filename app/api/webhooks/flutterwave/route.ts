import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { finalizeFlutterwaveTransaction } from "@/lib/flutterwave";
import { withErrorHandling, readJsonBody } from "@/lib/api-handler";

function isValidSignature(received: string | null): boolean {
  const expected = process.env.FLUTTERWAVE_SECRET_HASH;
  if (!expected || !received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Server-to-server webhook — the authoritative confirmation path (independent
 * of the tenant's browser making it back to /api/payments/flutterwave/callback).
 * Configure this URL + a secret hash in the Flutterwave dashboard, and set
 * that same hash as FLUTTERWAVE_SECRET_HASH.
 */
export const POST = withErrorHandling(async (request) => {
  const signature = request.headers.get("verif-hash");
  if (!isValidSignature(signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = (await readJsonBody(request)) as { data?: { id?: number | string } };
  const transactionId = body?.data?.id;
  if (!transactionId) {
    return NextResponse.json({ error: "Missing transaction id" }, { status: 400 });
  }

  const result = await finalizeFlutterwaveTransaction(String(transactionId));
  if (!result.ok) {
    console.error("[flutterwave webhook] Could not finalize transaction:", transactionId, result.reason);
  }

  // Always 200 — Flutterwave retries on non-2xx, which would create duplicate
  // verify calls for a transaction we've already correctly rejected.
  return NextResponse.json({ received: true });
});
