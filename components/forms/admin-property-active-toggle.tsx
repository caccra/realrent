"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, SecondaryButton } from "@/components/ui";

export function AdminPropertyActiveToggle({ propertyId, active }: { propertyId: string; active: boolean }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    let reason: string | null = "";
    if (active) {
      reason = prompt("Reason for hiding this listing (shown to the landlord and in the audit log):");
      if (reason === null) return;
    } else if (!confirm("Make this property visible in public listings again?")) {
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set-active", active: !active, reason }),
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
    <div className="flex items-center gap-3">
      <Badge tone={active ? "green" : "slate"}>{active ? "Active" : "Hidden from public"}</Badge>
      {active ? (
        <SecondaryButton onClick={handleClick} disabled={submitting} className="text-red-700">
          {submitting ? "Saving…" : "Deactivate"}
        </SecondaryButton>
      ) : (
        <Button onClick={handleClick} disabled={submitting}>
          {submitting ? "Saving…" : "Activate"}
        </Button>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
