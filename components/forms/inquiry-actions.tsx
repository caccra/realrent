"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, SecondaryButton, Input } from "@/components/ui";

const STATUS_TONE: Record<string, "green" | "amber" | "red" | "slate"> = {
  NEW: "amber",
  VIEWING_CONFIRMED: "green",
  VIEWING_RESCHEDULED: "amber",
  COMPLETED: "slate",
  CANCELLED: "red",
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "Requested",
  VIEWING_CONFIRMED: "Confirmed",
  VIEWING_RESCHEDULED: "Rescheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function InquiryActions({ inquiryId, status }: { inquiryId: string; status: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [newTime, setNewTime] = useState("");

  async function updateStatus(nextStatus: string, requestedViewingAt?: string) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/inquiries/${inquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, requestedViewingAt }),
      });
      if (res.ok) {
        setRescheduling(false);
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const isTerminal = status === "COMPLETED" || status === "CANCELLED";

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <Badge tone={STATUS_TONE[status] ?? "slate"}>{STATUS_LABELS[status] ?? status}</Badge>

      {!isTerminal && !rescheduling && (
        <>
          {status !== "VIEWING_CONFIRMED" && (
            <SecondaryButton className="text-xs" disabled={submitting} onClick={() => updateStatus("VIEWING_CONFIRMED")}>
              Confirm
            </SecondaryButton>
          )}
          <SecondaryButton className="text-xs" disabled={submitting} onClick={() => setRescheduling(true)}>
            Reschedule
          </SecondaryButton>
          {status === "VIEWING_CONFIRMED" && (
            <SecondaryButton className="text-xs" disabled={submitting} onClick={() => updateStatus("COMPLETED")}>
              Mark completed
            </SecondaryButton>
          )}
          <SecondaryButton className="text-xs text-red-700" disabled={submitting} onClick={() => updateStatus("CANCELLED")}>
            Cancel
          </SecondaryButton>
        </>
      )}

      {rescheduling && (
        <div className="flex items-center gap-2">
          <Input
            type="datetime-local"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="text-xs"
          />
          <SecondaryButton
            className="text-xs"
            disabled={submitting || !newTime}
            onClick={() => updateStatus("VIEWING_RESCHEDULED", newTime)}
          >
            Save
          </SecondaryButton>
          <SecondaryButton className="text-xs" onClick={() => setRescheduling(false)}>
            Cancel
          </SecondaryButton>
        </div>
      )}
    </div>
  );
}
