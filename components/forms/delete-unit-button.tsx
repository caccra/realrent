"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SecondaryButton } from "@/components/ui";

export function DeleteUnitButton({ unitId, hasLeaseHistory }: { unitId: string; hasLeaseHistory: boolean }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (hasLeaseHistory) {
    return null;
  }

  async function handleDelete() {
    if (!confirm("Delete this unit? This can't be undone.")) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/units/${unitId}`, { method: "DELETE" });
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
      <SecondaryButton onClick={handleDelete} disabled={submitting} className="text-sm text-red-700">
        {submitting ? "Deleting…" : "Delete unit"}
      </SecondaryButton>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
