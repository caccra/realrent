"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  maintenanceUpdateSchema,
  MAINTENANCE_STATUSES,
  type MaintenanceUpdateFormInput,
  type MaintenanceUpdateInput,
} from "@/lib/validations/maintenance";
import { Button, FieldError, Input, Label, SecondaryButton, Select } from "@/components/ui";

export function MaintenanceStatusForm({
  requestId,
  defaultValues,
}: {
  requestId: string;
  defaultValues: MaintenanceUpdateInput;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MaintenanceUpdateFormInput, unknown, MaintenanceUpdateInput>({
    resolver: zodResolver(maintenanceUpdateSchema),
    defaultValues,
  });

  async function onSubmit(data: MaintenanceUpdateInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/maintenance/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong");
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <SecondaryButton onClick={() => setOpen(true)} className="text-xs">
        Update
      </SecondaryButton>
    );
  }

  return (
    <form className="mt-3 space-y-3 border-t border-slate-100 pt-3" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor={`status-${requestId}`}>Status</Label>
          <Select id={`status-${requestId}`} {...register("status")}>
            {MAINTENANCE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor={`scheduledDate-${requestId}`}>Scheduled date</Label>
          <Input id={`scheduledDate-${requestId}`} type="date" {...register("scheduledDate")} />
        </div>
        <div>
          <Label htmlFor={`vendor-${requestId}`}>Vendor</Label>
          <Input id={`vendor-${requestId}`} {...register("vendor")} />
        </div>
      </div>
      <div>
        <Label htmlFor={`cost-${requestId}`}>Cost (UGX, optional)</Label>
        <Input id={`cost-${requestId}`} type="number" min={0} {...register("cost")} />
        <FieldError message={errors.cost?.message} />
      </div>
      {serverError && <p className="text-sm text-red-600">{serverError}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting} className="text-xs">
          {submitting ? "Saving…" : "Save"}
        </Button>
        <SecondaryButton type="button" onClick={() => setOpen(false)} className="text-xs">
          Cancel
        </SecondaryButton>
      </div>
    </form>
  );
}
