"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { propertySchema, type PropertyFormInput, type PropertyInput } from "@/lib/validations/property";
import { Button, SecondaryButton } from "@/components/ui";
import { PropertyFields } from "@/components/forms/property-fields";

export function EditPropertyForm({
  propertyId,
  defaultValues,
  onDone,
}: {
  propertyId: string;
  defaultValues: PropertyInput;
  onDone: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<PropertyFormInput, unknown, PropertyInput>({
    resolver: zodResolver(propertySchema),
    defaultValues,
  });

  const usage = useWatch({ control, name: "usage" });
  const isCommercial = usage === "COMMERCIAL";
  const listingType = useWatch({ control, name: "listingType" });
  const isSale = listingType === "SALE";

  async function onSubmit(data: PropertyInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
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
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <PropertyFields
        register={register}
        errors={errors}
        setValue={setValue}
        isCommercial={isCommercial}
        isSale={isSale}
      />
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
