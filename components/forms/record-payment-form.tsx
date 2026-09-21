"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  cashPaymentSchema,
  type CashPaymentFormInput,
  type CashPaymentInput,
} from "@/lib/validations/property";
import { Button, FieldError, Input, SecondaryButton } from "@/components/ui";

export function RecordPaymentForm({
  invoiceId,
  remainingAmount,
}: {
  invoiceId: string;
  remainingAmount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CashPaymentFormInput, unknown, CashPaymentInput>({
    resolver: zodResolver(cashPaymentSchema),
    defaultValues: { amount: remainingAmount },
  });

  if (!open) {
    return (
      <SecondaryButton onClick={() => setOpen(true)} className="text-sm">
        Record cash payment
      </SecondaryButton>
    );
  }

  async function onSubmit(data: CashPaymentInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay-cash`, {
        method: "POST",
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

  return (
    <form className="flex flex-wrap items-start gap-2" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Input
          type="number"
          min={0}
          max={remainingAmount}
          className="w-32"
          {...register("amount")}
        />
        <FieldError message={errors.amount?.message} />
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Confirm"}
      </Button>
      <SecondaryButton type="button" onClick={() => setOpen(false)}>
        Cancel
      </SecondaryButton>
      {serverError && <p className="w-full text-sm text-red-600">{serverError}</p>}
    </form>
  );
}
