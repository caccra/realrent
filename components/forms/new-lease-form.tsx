"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { leaseSchema, type LeaseFormInput, type LeaseInput } from "@/lib/validations/property";
import { Button, Card, FieldError, Input, Label, SecondaryButton } from "@/components/ui";

export function NewLeaseForm({
  unitId,
  defaultRentAmount,
}: {
  unitId: string;
  defaultRentAmount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ tenantPhone: string; tempPassword: string | null } | null>(
    null
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeaseFormInput, unknown, LeaseInput>({
    resolver: zodResolver(leaseSchema),
    defaultValues: {
      unitId,
      rentAmount: defaultRentAmount,
      depositAmount: defaultRentAmount,
      startDate: new Date().toISOString().slice(0, 10),
    },
  });

  if (created) {
    return (
      <Card className="mb-4 border-emerald-300 bg-emerald-50">
        <p className="font-medium text-emerald-900">Lease created</p>
        {created.tempPassword ? (
          <p className="mt-2 text-sm text-emerald-800">
            A new tenant account was created for {created.tenantPhone}. Share this temporary
            password with them so they can log in: <span className="font-mono font-semibold">{created.tempPassword}</span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-emerald-800">
            Linked to the existing tenant account for {created.tenantPhone}.
          </p>
        )}
      </Card>
    );
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="mt-2">
        Create lease
      </Button>
    );
  }

  async function onSubmit(data: LeaseInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/units/${unitId}/leases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong");
        return;
      }
      setCreated({ tenantPhone: body.tenantPhone, tempPassword: body.tempPassword });
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mt-2 mb-4">
      <h3 className="mb-4 text-sm font-medium text-slate-900">New lease</h3>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" {...register("unitId")} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tenantName">Tenant name</Label>
            <Input id="tenantName" {...register("tenantName")} />
            <FieldError message={errors.tenantName?.message} />
          </div>
          <div>
            <Label htmlFor="tenantPhone">Tenant phone</Label>
            <Input id="tenantPhone" placeholder="0771234567" {...register("tenantPhone")} />
            <FieldError message={errors.tenantPhone?.message} />
          </div>
          <div>
            <Label htmlFor="startDate">Start date</Label>
            <Input id="startDate" type="date" {...register("startDate")} />
            <FieldError message={errors.startDate?.message} />
          </div>
          <div>
            <Label htmlFor="rentAmount">Rent amount (UGX)</Label>
            <Input id="rentAmount" type="number" min={0} {...register("rentAmount")} />
            <FieldError message={errors.rentAmount?.message} />
          </div>
          <div>
            <Label htmlFor="depositAmount">Deposit amount (UGX)</Label>
            <Input id="depositAmount" type="number" min={0} {...register("depositAmount")} />
            <FieldError message={errors.depositAmount?.message} />
          </div>
        </div>
        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create lease"}
          </Button>
          <SecondaryButton type="button" onClick={() => setOpen(false)}>
            Cancel
          </SecondaryButton>
        </div>
      </form>
    </Card>
  );
}
