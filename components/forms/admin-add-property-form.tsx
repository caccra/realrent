"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { propertySchema, type PropertyFormInput, type PropertyInput } from "@/lib/validations/property";
import { Button, Card, FieldError, Label, Select, SecondaryButton } from "@/components/ui";
import { PropertyFields } from "@/components/forms/property-fields";
import { formatPhoneForDisplay } from "@/lib/phone";

type Landlord = { id: string; name: string; phone: string | null };

export function AdminAddPropertyForm({ landlords }: { landlords: Landlord[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [landlordId, setLandlordId] = useState(landlords[0]?.id ?? "");
  const [landlordError, setLandlordError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PropertyFormInput, unknown, PropertyInput>({
    resolver: zodResolver(propertySchema),
    defaultValues: { listingType: "RENTAL", saleCurrency: "UGX", amenities: [] },
  });

  const usage = useWatch({ control, name: "usage" });
  const isCommercial = usage === "COMMERCIAL";
  const listingType = useWatch({ control, name: "listingType" });
  const isSale = listingType === "SALE";

  async function onSubmit(data: PropertyInput) {
    setServerError(null);
    setLandlordError(null);
    if (!landlordId) {
      setLandlordError("Select a landlord");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, landlordId }),
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

  if (landlords.length === 0) {
    return (
      <p className="mb-6 text-sm text-slate-500">
        No landlord accounts exist yet — add one first before creating a property on their behalf.
      </p>
    );
  }

  if (!open) {
    return (
      <Button className="mb-6" onClick={() => setOpen(true)}>
        Add property
      </Button>
    );
  }

  return (
    <Card className="mb-6">
      <h3 className="mb-3 text-sm font-medium text-slate-900">Add a property on behalf of a landlord</h3>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Label htmlFor="landlordId">Landlord</Label>
          <Select id="landlordId" value={landlordId} onChange={(e) => setLandlordId(e.target.value)}>
            {landlords.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
                {l.phone && ` — ${formatPhoneForDisplay(l.phone)}`}
              </option>
            ))}
          </Select>
          <FieldError message={landlordError ?? undefined} />
        </div>

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
            {submitting ? "Creating…" : "Create property"}
          </Button>
          <SecondaryButton type="button" onClick={() => setOpen(false)}>
            Cancel
          </SecondaryButton>
        </div>
      </form>
    </Card>
  );
}
