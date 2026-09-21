"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SecondaryButton } from "@/components/ui";

export function MarkDepositRefundedButton({ leaseId }: { leaseId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!confirm("Mark this security deposit as refunded to the tenant?")) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/leases/${leaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-refunded" }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        return;
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <SecondaryButton onClick={handleClick} disabled={submitting}>
        {submitting ? "Saving…" : "Mark deposit refunded"}
      </SecondaryButton>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
