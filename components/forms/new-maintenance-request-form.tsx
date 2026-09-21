"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  newMaintenanceRequestSchema,
  MAINTENANCE_PRIORITIES,
  type NewMaintenanceRequestFormInput,
  type NewMaintenanceRequestInput,
} from "@/lib/validations/maintenance";
import { Button, Card, FieldError, Input, Label, Select, Textarea } from "@/components/ui";

type PropertyOption = { id: string; name: string; units: { id: string; label: string }[] };

export function NewMaintenanceRequestForm({ properties }: { properties: PropertyOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<NewMaintenanceRequestFormInput, unknown, NewMaintenanceRequestInput>({
    resolver: zodResolver(newMaintenanceRequestSchema),
    defaultValues: { priority: "MEDIUM" },
  });

  const propertyId = useWatch({ control, name: "propertyId" });
  const selectedProperty = properties.find((p) => p.id === propertyId);

  async function onSubmit(data: NewMaintenanceRequestInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong");
        return;
      }
      reset({ priority: "MEDIUM" });
      setOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="mb-6">
        New maintenance request
      </Button>
    );
  }

  return (
    <Card className="mb-6">
      <h2 className="mb-3 text-base font-medium text-slate-900">New maintenance request</h2>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="propertyId">Property</Label>
            <Select id="propertyId" {...register("propertyId")}>
              <option value="">Select property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <FieldError message={errors.propertyId?.message} />
          </div>
          <div>
            <Label htmlFor="unitId">Unit (optional)</Label>
            <Select id="unitId" disabled={!selectedProperty} {...register("unitId")}>
              <option value="">Whole property</option>
              {selectedProperty?.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" placeholder="e.g. Fix leaking roof" {...register("title")} />
          <FieldError message={errors.title?.message} />
        </div>

        <div>
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea id="description" rows={2} {...register("description")} />
          <FieldError message={errors.description?.message} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select id="priority" {...register("priority")}>
              {MAINTENANCE_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="scheduledDate">Scheduled date (optional)</Label>
            <Input id="scheduledDate" type="date" {...register("scheduledDate")} />
          </div>
          <div>
            <Label htmlFor="vendor">Vendor (optional)</Label>
            <Input id="vendor" placeholder="e.g. Acme Plumbing" {...register("vendor")} />
          </div>
        </div>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Create request"}
          </Button>
          <Button type="button" onClick={() => setOpen(false)} className="bg-slate-200 text-slate-700 hover:bg-slate-300">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
