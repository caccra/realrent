"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  lateFeePolicySchema,
  LATE_FEE_TYPES,
  type LateFeePolicyFormInput,
  type LateFeePolicyInput,
} from "@/lib/validations/late-fee";
import { Button, Card, FieldError, Input, Label, Select } from "@/components/ui";

export function LateFeePolicyForm({
  propertyId,
  defaultValues,
}: {
  propertyId: string;
  defaultValues: LateFeePolicyInput;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LateFeePolicyFormInput, unknown, LateFeePolicyInput>({
    resolver: zodResolver(lateFeePolicySchema),
    defaultValues,
  });

  const lateFeeEnabled = useWatch({ control, name: "lateFeeEnabled" });

  async function onSubmit(data: LateFeePolicyInput) {
    setServerError(null);
    setSaved(false);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/late-fee-policy`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong");
        return;
      }
      setSaved(true);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mb-6">
      <h2 className="mb-1 text-sm font-medium text-slate-900">Late rent policy</h2>
      <p className="mb-4 text-sm text-slate-500">
        Automatically flag overdue rent and apply a late fee after a grace period. Applied by the
        scheduled rent cycle job.
      </p>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" {...register("lateFeeEnabled")} />
          Charge a late fee on overdue rent
        </label>

        {lateFeeEnabled && (
          <div className="grid grid-cols-1 gap-3 pl-6 sm:grid-cols-3">
            <div>
              <Label htmlFor="lateFeeType">Fee type</Label>
              <Select id="lateFeeType" {...register("lateFeeType")}>
                <option value="">Select</option>
                {LATE_FEE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
              <FieldError message={errors.lateFeeType?.message} />
            </div>
            <div>
              <Label htmlFor="lateFeeValue">Amount</Label>
              <Input id="lateFeeValue" type="number" min={0} {...register("lateFeeValue")} />
              <FieldError message={errors.lateFeeValue?.message} />
            </div>
            <div>
              <Label htmlFor="lateFeeGraceDays">Grace period (days)</Label>
              <Input id="lateFeeGraceDays" type="number" min={0} max={60} {...register("lateFeeGraceDays")} />
              <FieldError message={errors.lateFeeGraceDays?.message} />
            </div>
          </div>
        )}

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        {saved && !serverError && <p className="text-sm text-ivy-700">Saved.</p>}

        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save late fee policy"}
        </Button>
      </form>
    </Card>
  );
}
