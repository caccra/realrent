"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  propertySchema,
  unitSchema,
  type PropertyFormInput,
  type PropertyInput,
  type UnitFormInput,
  type UnitInput,
} from "@/lib/validations/property";
import { Button, Card, SecondaryButton } from "@/components/ui";
import { PropertyFields } from "@/components/forms/property-fields";
import { UnitFields } from "@/components/forms/unit-fields";
import { PhotoGallery } from "@/components/forms/photo-gallery";
import { usePropertyImages } from "@/lib/hooks/use-property-images";

const STEPS = ["Details", "Photos", "First unit"];

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="mb-6 flex items-center gap-2 text-sm">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
              i + 1 <= step ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-500"
            }`}
          >
            {i + 1}
          </span>
          <span className={i + 1 === step ? "font-medium text-slate-900" : "text-slate-500"}>{label}</span>
          {i < STEPS.length - 1 && <span className="mx-2 h-px w-8 bg-slate-200" />}
        </div>
      ))}
    </div>
  );
}

export function AddPropertyWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [unitError, setUnitError] = useState<string | null>(null);
  const [creatingUnit, setCreatingUnit] = useState(false);

  const detailsForm = useForm<PropertyFormInput, unknown, PropertyInput>({
    resolver: zodResolver(propertySchema),
    defaultValues: { amenities: [] },
  });

  const unitForm = useForm<UnitFormInput, unknown, UnitInput>({
    resolver: zodResolver(unitSchema),
    defaultValues: { bedrooms: 1, billingCycle: "MONTHLY" },
  });

  const photoState = usePropertyImages(propertyId ?? "", []);
  const usage = useWatch({ control: detailsForm.control, name: "usage" });
  const isCommercial = usage === "COMMERCIAL";

  async function onCreateProperty(data: PropertyInput) {
    setDetailsError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setDetailsError(body.error ?? "Something went wrong");
        return;
      }
      setPropertyId(body.id);
      setStep(2);
    } finally {
      setCreating(false);
    }
  }

  function finish() {
    if (!propertyId) return;
    router.push(`/landlord/properties/${propertyId}`);
    router.refresh();
  }

  async function onCreateUnit(data: UnitInput) {
    if (!propertyId) return;
    setUnitError(null);
    setCreatingUnit(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setUnitError(body.error ?? "Something went wrong");
        return;
      }
      finish();
    } finally {
      setCreatingUnit(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <StepIndicator step={step} />

      {step === 1 && (
        <form className="space-y-4" onSubmit={detailsForm.handleSubmit(onCreateProperty)}>
          <PropertyFields
            register={detailsForm.register}
            errors={detailsForm.formState.errors}
            setValue={detailsForm.setValue}
            isCommercial={isCommercial}
          />
          {detailsError && <p className="text-sm text-red-600">{detailsError}</p>}
          <Button type="submit" disabled={creating}>
            {creating ? "Saving…" : "Save and continue"}
          </Button>
        </form>
      )}

      {step === 2 && propertyId && (
        <div className="space-y-4">
          <PhotoGallery
            images={photoState.images}
            uploading={photoState.uploading}
            busyId={photoState.busyId}
            error={photoState.error}
            onUpload={photoState.uploadFiles}
            onDelete={photoState.deleteImage}
            onSetFeatured={photoState.setFeatured}
          />
          <div className="flex gap-2">
            <Button type="button" onClick={() => setStep(3)}>
              {photoState.images.length > 0 ? "Continue" : "Skip photos"}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && propertyId && (
        <form className="space-y-4" onSubmit={unitForm.handleSubmit(onCreateUnit)}>
          <UnitFields
            register={unitForm.register}
            errors={unitForm.formState.errors}
            isCommercial={isCommercial}
          />
          {unitError && <p className="text-sm text-red-600">{unitError}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={creatingUnit}>
              {creatingUnit ? "Saving…" : "Finish"}
            </Button>
            <SecondaryButton type="button" onClick={finish}>
              Skip for now
            </SecondaryButton>
          </div>
        </form>
      )}
    </Card>
  );
}
