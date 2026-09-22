"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { leaseSchema, type LeaseFormInput, type LeaseInput } from "@/lib/validations/property";
import { Button, Card, FieldError, Input, Label, SecondaryButton, Select } from "@/components/ui";
import { TenantScreeningCard } from "@/components/tenant-screening-card";
import type { getTenantScreeningReport } from "@/lib/data";

type LookupResult =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error"; message: string }
  | { status: "found"; name: string; report: Awaited<ReturnType<typeof getTenantScreeningReport>> };

type PropertyOption = {
  id: string;
  name: string;
  units: { id: string; label: string; rentAmount: number; billingCycle: string }[];
};

export function AssignTenantForm({ properties }: { properties: PropertyOption[] }) {
  const router = useRouter();
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ id: string; tenantPhone: string; tempPassword: string | null } | null>(
    null
  );
  const [lookup, setLookup] = useState<LookupResult>({ status: "idle" });

  const selectedProperty = properties.find((p) => p.id === propertyId) ?? properties[0];
  const units = selectedProperty?.units ?? [];

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<LeaseFormInput, unknown, LeaseInput>({
    resolver: zodResolver(leaseSchema),
    defaultValues: {
      unitId: units[0]?.id ?? "",
      rentAmount: units[0]?.rentAmount ?? 0,
      depositAmount: units[0]?.rentAmount ?? 0,
      startDate: new Date().toISOString().slice(0, 10),
    },
  });

  async function handleLookup() {
    const phone = getValues("tenantPhone");
    if (!phone) return;
    setLookup({ status: "loading" });
    try {
      const res = await fetch(`/api/tenants/lookup?phone=${encodeURIComponent(phone)}`);
      const body = await res.json();
      if (!res.ok) {
        setLookup({ status: "error", message: body.error ?? "Something went wrong" });
        return;
      }
      setLookup(body.exists ? { status: "found", name: body.name, report: body.report } : { status: "not-found" });
    } catch {
      setLookup({ status: "error", message: "Couldn't reach the server" });
    }
  }

  function handleUnitChange(unitId: string) {
    const unit = units.find((u) => u.id === unitId);
    if (unit) {
      setValue("rentAmount", unit.rentAmount);
      setValue("depositAmount", unit.rentAmount);
    }
  }

  async function onSubmit(data: LeaseInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/units/${data.unitId}/leases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong");
        return;
      }
      setCreated({ id: body.id, tenantPhone: body.tenantPhone, tempPassword: body.tempPassword });
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <Card className="max-w-xl border-emerald-300 bg-emerald-50">
        <p className="font-medium text-emerald-900">Tenant assigned</p>
        {created.tempPassword ? (
          <p className="mt-2 text-sm text-emerald-800">
            A new tenant account was created for {created.tenantPhone}. Share this temporary
            password with them so they can log in:{" "}
            <span className="font-mono font-semibold">{created.tempPassword}</span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-emerald-800">
            Linked to the existing tenant account for {created.tenantPhone}.
          </p>
        )}
        <a
          href={`/landlord/leases/${created.id}`}
          className="mt-4 inline-block rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Manage this client →
        </a>
      </Card>
    );
  }

  return (
    <Card className="max-w-xl">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Label htmlFor="propertyId">Property</Label>
          <Select
            id="propertyId"
            value={propertyId}
            onChange={(e) => {
              const nextId = e.target.value;
              setPropertyId(nextId);
              const nextUnits = properties.find((p) => p.id === nextId)?.units ?? [];
              setValue("unitId", nextUnits[0]?.id ?? "");
              if (nextUnits[0]) {
                setValue("rentAmount", nextUnits[0].rentAmount);
                setValue("depositAmount", nextUnits[0].rentAmount);
              }
            }}
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="unitId">Vacant unit</Label>
          <Select
            id="unitId"
            {...register("unitId", {
              onChange: (e) => handleUnitChange(e.target.value),
            })}
          >
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </Select>
          <FieldError message={errors.unitId?.message} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tenantName">Tenant name</Label>
            <Input id="tenantName" {...register("tenantName")} />
            <FieldError message={errors.tenantName?.message} />
          </div>
          <div>
            <Label htmlFor="tenantPhone">Tenant phone</Label>
            <div className="flex gap-2">
              <Input id="tenantPhone" placeholder="0771234567" {...register("tenantPhone")} />
              <SecondaryButton type="button" onClick={handleLookup} className="shrink-0 text-xs">
                Check history
              </SecondaryButton>
            </div>
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

        {lookup.status === "loading" && <p className="text-sm text-slate-500">Checking…</p>}
        {lookup.status === "not-found" && (
          <p className="text-sm text-slate-500">No RealRent account found for that number yet — a new one will be created.</p>
        )}
        {lookup.status === "error" && <p className="text-sm text-red-600">{lookup.message}</p>}
        {lookup.status === "found" && (
          <div>
            <p className="mb-2 text-sm font-medium text-slate-900">Existing tenant: {lookup.name}</p>
            <TenantScreeningCard report={lookup.report} />
          </div>
        )}

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <Button type="submit" disabled={submitting}>
          {submitting ? "Assigning…" : "Assign tenant"}
        </Button>
      </form>
    </Card>
  );
}
