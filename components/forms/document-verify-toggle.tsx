"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, SecondaryButton } from "@/components/ui";

export function DocumentVerifyToggle({ documentId, verified }: { documentId: string; verified: boolean }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function toggle() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: !verified }),
      });
      if (res.ok) router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <span className="flex items-center gap-2">
      <Badge tone={verified ? "green" : "slate"}>{verified ? "Verified" : "Unverified"}</Badge>
      <SecondaryButton onClick={toggle} disabled={submitting} className="text-xs">
        {submitting ? "Saving…" : verified ? "Unverify" : "Mark verified"}
      </SecondaryButton>
    </span>
  );
}
