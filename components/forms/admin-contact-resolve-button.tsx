"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SecondaryButton } from "@/components/ui";

export function AdminContactResolveButton({ id, resolved }: { id: string; resolved: boolean }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/contact/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve" }),
      });
      if (res.ok) router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SecondaryButton onClick={handleClick} disabled={submitting} className="text-xs">
      {submitting ? "Saving…" : resolved ? "Mark unresolved" : "Mark resolved"}
    </SecondaryButton>
  );
}
