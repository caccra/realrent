"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { appointPropertyManagerSchema, type AppointPropertyManagerInput } from "@/lib/validations/property";
import { Button, Card, FieldError, Input, Label, SecondaryButton } from "@/components/ui";
import { formatPhoneForDisplay } from "@/lib/phone";

type PropertyManager = { id: string; manager: { id: string; name: string; phone: string | null } };

export function PropertyManagerSection({
  propertyId,
  managers,
}: {
  propertyId: string;
  managers: PropertyManager[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [created, setCreated] = useState<{ phone: string; tempPassword: string | null } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AppointPropertyManagerInput>({ resolver: zodResolver(appointPropertyManagerSchema) });

  async function onSubmit(data: AppointPropertyManagerInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/property-managers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong");
        return;
      }
      setCreated({ phone: body.manager.phone, tempPassword: body.tempPassword });
      reset();
      setOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(managerId: string) {
    if (!confirm("Remove this property manager from the property?")) return;
    setRemovingId(managerId);
    try {
      const res = await fetch(`/api/properties/${propertyId}/property-managers/${managerId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json();
        setServerError(body.error ?? "Something went wrong");
        return;
      }
      router.refresh();
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Card className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-medium text-slate-900">Property managers</h2>
        {!open && <Button onClick={() => setOpen(true)}>Appoint property manager</Button>}
      </div>
      <p className="mb-3 text-xs text-slate-400">
        Property managers get full access to this property — units, leases, payments, and reports —
        just like you. Only you can appoint or remove them.
      </p>

      {created && (
        <div className="mb-3 rounded-md border border-ivy-200 bg-ivy-50 p-3 text-sm text-ivy-900">
          {created.tempPassword ? (
            <>
              A new property manager account was created for {formatPhoneForDisplay(created.phone)}.
              Share this temporary password with them so they can log in:{" "}
              <span className="font-mono font-semibold">{created.tempPassword}</span>
            </>
          ) : (
            <>Linked to the existing property manager account for {formatPhoneForDisplay(created.phone)}.</>
          )}
        </div>
      )}

      {open && (
        <form className="mb-4 space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="managerName">Name</Label>
              <Input id="managerName" {...register("name")} />
              <FieldError message={errors.name?.message} />
            </div>
            <div>
              <Label htmlFor="managerPhone">Phone</Label>
              <Input id="managerPhone" placeholder="0771234567" {...register("phone")} />
              <FieldError message={errors.phone?.message} />
            </div>
          </div>
          {serverError && <p className="text-sm text-red-600">{serverError}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Appointing…" : "Appoint"}
            </Button>
            <SecondaryButton type="button" onClick={() => setOpen(false)}>
              Cancel
            </SecondaryButton>
          </div>
        </form>
      )}

      {managers.length === 0 ? (
        <p className="text-sm text-slate-500">No property managers appointed for this property yet.</p>
      ) : (
        <ul className="space-y-2">
          {managers.map((a) => (
            <li key={a.id} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">
                {a.manager.name}
                {a.manager.phone && ` · ${formatPhoneForDisplay(a.manager.phone)}`}
              </span>
              <SecondaryButton
                className="text-xs text-red-700"
                onClick={() => handleRemove(a.manager.id)}
                disabled={removingId === a.manager.id}
              >
                {removingId === a.manager.id ? "Removing…" : "Remove"}
              </SecondaryButton>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
