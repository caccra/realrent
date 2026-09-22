"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, SecondaryButton } from "@/components/ui";

export function AdminSuspendUserButton({ userId, suspended }: { userId: string; suspended: boolean }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    let reason: string | null = "";
    if (!suspended) {
      reason = prompt("Reason for suspending this account (shown in the audit log):");
      if (reason === null) return;
    } else if (!confirm("Restore this account's access?")) {
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suspend", suspended: !suspended, reason }),
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
      {suspended ? (
        <SecondaryButton onClick={handleClick} disabled={submitting}>
          {submitting ? "Saving…" : "Restore access"}
        </SecondaryButton>
      ) : (
        <Button onClick={handleClick} disabled={submitting} className="bg-red-700 hover:bg-red-800">
          {submitting ? "Saving…" : "Suspend account"}
        </Button>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
