"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { whatsappNumberSchema, type WhatsAppNumberInput } from "@/lib/validations/whatsapp";
import { Button, Card, FieldError, Input, Label } from "@/components/ui";
import { formatPhoneForDisplay } from "@/lib/phone";

export function WhatsAppNumberForm({ currentNumber }: { currentNumber: string | null }) {
  const router = useRouter();
  const [displayNumber, setDisplayNumber] = useState(currentNumber);
  const [editing, setEditing] = useState(!currentNumber);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WhatsAppNumberInput>({
    resolver: zodResolver(whatsappNumberSchema),
    defaultValues: { whatsappNumber: currentNumber ? formatPhoneForDisplay(currentNumber) : "" },
  });

  async function onSubmit(data: WhatsAppNumberInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/settings/whatsapp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong");
        return;
      }
      // Update from the server's response immediately rather than waiting on
      // router.refresh() to re-deliver a fresh `currentNumber` prop — that
      // refresh lands a tick later, and rendering the "saved" view against
      // the still-stale (possibly null) prop in between is what crashed here.
      const saved: string | null = body.whatsappNumber ?? null;
      setDisplayNumber(saved);
      setEditing(!saved);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <p className="text-sm font-medium text-slate-900">WhatsApp number</p>
      <p className="mt-1 text-sm text-slate-500">
        Shown to {displayNumber ? "the other party" : "landlords/tenants you deal with"} as a tap-to-chat
        WhatsApp link. Leave blank to hide it.
      </p>

      {!editing ? (
        <div className="mt-3 flex items-center gap-3">
          <p className="font-medium text-slate-900">{formatPhoneForDisplay(displayNumber)}</p>
          <button
            type="button"
            className="text-xs font-medium text-ivy-700 hover:text-ivy-800"
            onClick={() => setEditing(true)}
          >
            Change
          </button>
        </div>
      ) : (
        <form className="mt-3 space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Label htmlFor="whatsappNumber">Phone number</Label>
            <Input id="whatsappNumber" placeholder="0771234567" {...register("whatsappNumber")} />
            <FieldError message={errors.whatsappNumber?.message} />
          </div>
          {serverError && <p className="text-sm text-red-600">{serverError}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save"}
            </Button>
            {displayNumber && (
              <button
                type="button"
                className="text-sm text-slate-500 hover:text-slate-700"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </Card>
  );
}
