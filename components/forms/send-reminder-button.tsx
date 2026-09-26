"use client";

import { useState } from "react";
import { SecondaryButton } from "@/components/ui";

export function SendReminderButton({ invoiceId }: { invoiceId: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/remind`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        return;
      }
      setMessage("Reminder sent");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <SecondaryButton onClick={handleClick} disabled={submitting} className="text-xs">
        {submitting ? "Sending…" : "Send reminder"}
      </SecondaryButton>
      {message && <p className="mt-1 text-xs text-ivy-700">{message}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
