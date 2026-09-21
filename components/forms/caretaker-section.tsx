"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { appointCaretakerSchema, type AppointCaretakerInput } from "@/lib/validations/property";
import { Button, Card, FieldError, Input, Label, SecondaryButton } from "@/components/ui";
import { formatPhoneForDisplay } from "@/lib/phone";

type Caretaker = { id: string; caretaker: { id: string; name: string; phone: string | null } };

export function CaretakerSection({
  propertyId,
  caretakers,
}: {
  propertyId: string;
  caretakers: Caretaker[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [created, setCreated] = useState<{ phone: string; tempPassword: string | null } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AppointCaretakerInput>({ resolver: zodResolver(appointCaretakerSchema) });

  async function onSubmit(data: AppointCaretakerInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/caretakers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong");
        return;
      }
      setCreated({ phone: body.caretaker.phone, tempPassword: body.tempPassword });
      reset();
      setOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(caretakerId: string) {
    if (!confirm("Remove this caretaker from the property?")) return;
    setRemovingId(caretakerId);
    try {
      const res = await fetch(`/api/properties/${propertyId}/caretakers/${caretakerId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json();
        setServerError(body.error ?? "Something went wrong");
        return;
      }
      router.refresh();
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Card className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-medium text-slate-900">Caretakers / managers</h2>
        {!open && <Button onClick={() => setOpen(true)}>Appoint caretaker</Button>}
      </div>

      {created && (
        <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          {created.tempPassword ? (
            <>
              A new caretaker account was created for {formatPhoneForDisplay(created.phone)}. Share
              this temporary password with them so they can log in:{" "}
              <span className="font-mono font-semibold">{created.tempPassword}</span>
            </>
          ) : (
            <>Linked to the existing caretaker account for {formatPhoneForDisplay(created.phone)}.</>
          )}
        </div>
      )}

      {open && (
        <form className="mb-4 space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="caretakerName">Name</Label>
              <Input id="caretakerName" {...register("name")} />
              <FieldError message={errors.name?.message} />
            </div>
            <div>
              <Label htmlFor="caretakerPhone">Phone</Label>
              <Input id="caretakerPhone" placeholder="0771234567" {...register("phone")} />
              <FieldError message={errors.phone?.message} />
            </div>
          </div>
          {serverError && <p className="text-sm text-red-600">{serverError}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Appointing…" : "Appoint"}
            </Button>
            <SecondaryButton type="button" onClick={() => setOpen(false)}>
              Cancel
            </SecondaryButton>
          </div>
        </form>
      )}

      {caretakers.length === 0 ? (
        <p className="text-sm text-slate-500">No caretakers appointed for this property yet.</p>
      ) : (
        <ul className="space-y-2">
          {caretakers.map((a) => (
            <li key={a.id} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">
                {a.caretaker.name}
                {a.caretaker.phone && ` · ${formatPhoneForDisplay(a.caretaker.phone)}`}
              </span>
              <SecondaryButton
                className="text-xs text-red-700"
                onClick={() => handleRemove(a.caretaker.id)}
                disabled={removingId === a.caretaker.id}
              >
                {removingId === a.caretaker.id ? "Removing…" : "Remove"}
              </SecondaryButton>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
