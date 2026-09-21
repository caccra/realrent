"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { unitSchema, type UnitFormInput, type UnitInput } from "@/lib/validations/property";
import { Button, Card, SecondaryButton } from "@/components/ui";
import { UnitFields } from "@/components/forms/unit-fields";

export function NewUnitForm({ propertyId, isCommercial }: { propertyId: string; isCommercial?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UnitFormInput, unknown, UnitInput>({
    resolver: zodResolver(unitSchema),
    defaultValues: { bedrooms: 1, billingCycle: "MONTHLY" },
  });

  if (!open) {
    return <Button onClick={() => setOpen(true)}>Add unit</Button>;
  }

  async function onSubmit(data: UnitInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/units`, {
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

  return (
    <Card className="mb-6">
      <h2 className="mb-4 text-base font-medium text-slate-900">Add a unit</h2>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <UnitFields register={register} errors={errors} isCommercial={isCommercial} />
        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save unit"}
          </Button>
          <SecondaryButton type="button" onClick={() => setOpen(false)}>
            Cancel
          </SecondaryButton>
        </div>
      </form>
    </Card>
  );
}
