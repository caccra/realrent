"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SecondaryButton } from "@/components/ui";

export function DeletePropertyButton({ propertyId, unitCount }: { propertyId: string; unitCount: number }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (unitCount > 0) {
    return (
      <p className="text-sm text-slate-400" title="Remove all units first">
        Delete unavailable while this property has units
      </p>
    );
  }

  async function handleDelete() {
    if (!confirm("Delete this property? This can't be undone.")) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        return;
      }
      router.push("/landlord/properties");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <SecondaryButton onClick={handleDelete} disabled={submitting} className="text-red-700">
        {submitting ? "Deleting…" : "Delete property"}
      </SecondaryButton>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
