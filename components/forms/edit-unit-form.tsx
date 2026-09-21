"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { unitSchema, type UnitFormInput, type UnitInput } from "@/lib/validations/property";
import { Button, SecondaryButton } from "@/components/ui";
import { UnitFields } from "@/components/forms/unit-fields";

export function EditUnitForm({
  unitId,
  defaultValues,
  isCommercial,
  onDone,
}: {
  unitId: string;
  defaultValues: UnitInput;
  isCommercial?: boolean;
  onDone: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UnitFormInput, unknown, UnitInput>({
    resolver: zodResolver(unitSchema),
    defaultValues,
  });

  async function onSubmit(data: UnitInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/units/${unitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong");
        return;
      }
      onDone();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
      <UnitFields register={register} errors={errors} isCommercial={isCommercial} />
      {serverError && <p className="text-sm text-red-600">{serverError}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save changes"}
        </Button>
        <SecondaryButton type="button" onClick={onDone}>
          Cancel
        </SecondaryButton>
      </div>
    </form>
  );
}
