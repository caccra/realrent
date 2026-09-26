"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  paymentPreferencesSchema,
  MOMO_PROVIDERS,
  type PaymentPreferencesFormInput,
  type PaymentPreferencesInput,
} from "@/lib/validations/payment-preferences";
import { Button, Card, FieldError, Input, Label, Select } from "@/components/ui";

export function PaymentPreferencesForm({ defaultValues }: { defaultValues: PaymentPreferencesInput }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PaymentPreferencesFormInput, unknown, PaymentPreferencesInput>({
    resolver: zodResolver(paymentPreferencesSchema),
    defaultValues,
  });

  const acceptsMobileMoney = useWatch({ control, name: "acceptsMobileMoney" });
  const acceptsBankTransfer = useWatch({ control, name: "acceptsBankTransfer" });

  async function onSubmit(data: PaymentPreferencesInput) {
    setServerError(null);
    setSaved(false);
    setSubmitting(true);
    try {
      const res = await fetch("/api/settings/payment-preferences", {
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
    <Card className="max-w-xl">
      <h2 className="mb-1 text-base font-medium text-slate-900">Payment methods</h2>
      <p className="mb-4 text-sm text-slate-500">
        Let tenants know how you prefer to receive rent. This is shown on your tenants&apos;
        dashboards and on your public listings.
      </p>

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" {...register("acceptsCash")} />
            Cash
          </label>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" {...register("acceptsMobileMoney")} />
            Mobile Money
          </label>
          {acceptsMobileMoney && (
            <div className="grid grid-cols-1 gap-3 pl-6 sm:grid-cols-2">
              <div>
                <Label htmlFor="momoProvider">Provider</Label>
                <Select id="momoProvider" {...register("momoProvider")}>
                  <option value="">Select provider</option>
                  {MOMO_PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </Select>
                <FieldError message={errors.momoProvider?.message} />
              </div>
              <div>
                <Label htmlFor="momoNumber">Mobile Money number</Label>
                <Input id="momoNumber" placeholder="0771234567" {...register("momoNumber")} />
                <FieldError message={errors.momoNumber?.message} />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" {...register("acceptsBankTransfer")} />
            Bank transfer
          </label>
          {acceptsBankTransfer && (
            <div className="grid grid-cols-1 gap-3 pl-6 sm:grid-cols-2">
              <div>
                <Label htmlFor="bankName">Bank name</Label>
                <Input id="bankName" placeholder="Stanbic Bank" {...register("bankName")} />
                <FieldError message={errors.bankName?.message} />
              </div>
              <div>
                <Label htmlFor="bankAccountName">Account name</Label>
                <Input id="bankAccountName" {...register("bankAccountName")} />
                <FieldError message={errors.bankAccountName?.message} />
              </div>
              <div className="col-span-2">
                <Label htmlFor="bankAccountNumber">Account number</Label>
                <Input id="bankAccountNumber" {...register("bankAccountNumber")} />
                <FieldError message={errors.bankAccountNumber?.message} />
              </div>
            </div>
          )}
        </div>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        {saved && !serverError && <p className="text-sm text-ivy-700">Saved.</p>}

        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save payment methods"}
        </Button>
      </form>
    </Card>
  );
}
