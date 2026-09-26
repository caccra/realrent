"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, SecondaryButton } from "@/components/ui";

export function LeaseEndDateControl({ leaseId, endDate }: { leaseId: string; endDate: string | Date | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(endDate ? new Date(endDate).toISOString().slice(0, 10) : "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function save() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/leases/${leaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set-end-date", endDate: value || null }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        return;
      }
      setEditing(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (!editing) {
    return (
      <div>
        <p className="text-sm text-slate-500">Lease end date</p>
        <p className="font-medium text-slate-900">
          {endDate ? new Date(endDate).toLocaleDateString("en-UG") : "Open-ended"}
        </p>
        <button
          type="button"
          className="text-xs font-medium text-ivy-700 hover:text-ivy-800"
          onClick={() => setEditing(true)}
        >
          {endDate ? "Change" : "Set end date"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-slate-500">Lease end date</p>
      <Input type="date" value={value} onChange={(e) => setValue(e.target.value)} className="mt-1" />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <div className="mt-2 flex gap-2">
        <Button type="button" onClick={save} disabled={submitting} className="px-2 py-1 text-xs">
          {submitting ? "Saving…" : "Save"}
        </Button>
        <SecondaryButton type="button" onClick={() => setEditing(false)} className="px-2 py-1 text-xs">
          Cancel
        </SecondaryButton>
      </div>
    </div>
  );
}
