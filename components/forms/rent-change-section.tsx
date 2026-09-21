"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  rentChangeSchema,
  type RentChangeFormInput,
  type RentChangeInput,
} from "@/lib/validations/rent-change";
import { Button, Card, FieldError, Input, Label, SecondaryButton } from "@/components/ui";
import { formatUGX } from "@/lib/money";

type RentChangeItem = {
  id: string;
  newRentAmount: string | number | { toString(): string };
  effectiveDate: string | Date;
  note: string | null;
};

export function RentChangeSection({
  leaseId,
  rentChanges,
}: {
  leaseId: string;
  rentChanges: RentChangeItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RentChangeFormInput, unknown, RentChangeInput>({
    resolver: zodResolver(rentChangeSchema),
  });

  async function onSubmit(data: RentChangeInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/leases/${leaseId}/rent-changes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong");
        return;
      }
      reset();
      setOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this scheduled rent change?")) return;
    setCancellingId(id);
    try {
      const res = await fetch(`/api/rent-changes/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setCancellingId(null);
    }
  }

  const now = new Date();

  return (
    <Card className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-medium text-slate-900">Rent changes</h2>
        {!open && <Button onClick={() => setOpen(true)}>Schedule rent change</Button>}
      </div>

      {open && (
        <form className="mb-4 space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="newRentAmount">New rent amount (UGX)</Label>
              <Input id="newRentAmount" type="number" min={0} {...register("newRentAmount")} />
              <FieldError message={errors.newRentAmount?.message} />
            </div>
            <div>
              <Label htmlFor="effectiveDate">Effective date</Label>
              <Input id="effectiveDate" type="date" {...register("effectiveDate")} />
              <FieldError message={errors.effectiveDate?.message} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Input id="note" placeholder="Annual increase" {...register("note")} />
              <FieldError message={errors.note?.message} />
            </div>
          </div>
          {serverError && <p className="text-sm text-red-600">{serverError}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Scheduling…" : "Schedule"}
            </Button>
            <SecondaryButton type="button" onClick={() => setOpen(false)}>
              Cancel
            </SecondaryButton>
          </div>
        </form>
      )}

      {rentChanges.length === 0 ? (
        <p className="text-sm text-slate-500">No rent changes scheduled.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {rentChanges.map((rc) => {
            const isFuture = new Date(rc.effectiveDate) > now;
            return (
              <li key={rc.id} className="flex items-center justify-between">
                <span className="text-slate-700">
                  {formatUGX(rc.newRentAmount.toString())} from{" "}
                  {new Date(rc.effectiveDate).toLocaleDateString("en-UG")}
                  {rc.note && ` · ${rc.note}`}
                  {isFuture && <span className="ml-2 text-emerald-700">(upcoming)</span>}
                </span>
                {isFuture && (
                  <SecondaryButton
                    className="text-xs text-red-700"
                    onClick={() => handleCancel(rc.id)}
                    disabled={cancellingId === rc.id}
                  >
                    {cancellingId === rc.id ? "…" : "Cancel"}
                  </SecondaryButton>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
