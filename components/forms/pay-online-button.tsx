"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function PayOnlineButton({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay-online`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not start the payment. Please try again.");
        setLoading(false);
        return;
      }
      window.location.href = data.link;
    } catch {
      setError("Could not start the payment. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="print:hidden">
      <Button type="button" onClick={handlePay} disabled={loading}>
        {loading ? "Starting payment…" : "Pay with Mobile Money"}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
