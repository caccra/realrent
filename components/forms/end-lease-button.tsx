"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { endLeaseSchema, type EndLeaseFormInput, type EndLeaseInput } from "@/lib/validations/lease";
import { Button, Input, Label, SecondaryButton, Textarea } from "@/components/ui";
import { formatUGX } from "@/lib/money";

export function EndLeaseButton({ leaseId, depositAmount }: { leaseId: string; depositAmount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
  } = useForm<EndLeaseFormInput, unknown, EndLeaseInput>({
    resolver: zodResolver(endLeaseSchema),
    defaultValues: { depositDeductions: 0, depositDeductionNote: "", markRefunded: false },
  });

  const deductions = Number(useWatch({ control, name: "depositDeductions" }) || 0);
  const refundAmount = Math.max(depositAmount - deductions, 0);

  async function onSubmit(data: EndLeaseInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/leases/${leaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end", ...data }),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong");
        return;
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <SecondaryButton onClick={() => setOpen(true)} className="text-red-700">
        End lease
      </SecondaryButton>
    );
  }

  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4">
      <p className="mb-3 text-sm font-medium text-slate-900">
        End this lease and settle the security deposit ({formatUGX(depositAmount)})
      </p>
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="depositDeductions">Deductions (UGX)</Label>
            <Input id="depositDeductions" type="number" min={0} {...register("depositDeductions")} />
          </div>
          <div>
            <Label>Refund due</Label>
            <p className="mt-2 text-sm font-medium text-slate-900">{formatUGX(refundAmount)}</p>
          </div>
        </div>
        <div>
          <Label htmlFor="depositDeductionNote">Deduction note (optional)</Label>
          <Textarea
            id="depositDeductionNote"
            rows={2}
            placeholder="e.g. Repainting, broken fixtures…"
            {...register("depositDeductionNote")}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" {...register("markRefunded")} />
          The refund has already been paid to the tenant
        </label>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting} className="bg-red-700 hover:bg-red-800">
            {submitting ? "Ending…" : "Confirm end lease"}
          </Button>
          <SecondaryButton type="button" onClick={() => setOpen(false)}>
            Cancel
          </SecondaryButton>
        </div>
      </form>
    </div>
  );
}
