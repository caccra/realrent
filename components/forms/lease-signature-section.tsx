"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { signLeaseSchema, type SignLeaseInput } from "@/lib/validations/signature";
import { Button, Card, FieldError, Input } from "@/components/ui";

type Signature = {
  id: string;
  signerRole: string;
  typedName: string;
  signedAt: string | Date;
  signer: { name: string };
};

const ROLE_LABELS: Record<string, string> = {
  TENANT: "Tenant",
  LANDLORD: "Landlord",
};

export function LeaseSignatureSection({
  leaseId,
  signatures,
  canSign,
  signAsRole,
}: {
  leaseId: string;
  signatures: Signature[];
  canSign: boolean;
  signAsRole: "TENANT" | "LANDLORD";
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignLeaseInput>({ resolver: zodResolver(signLeaseSchema) });

  async function onSubmit(data: SignLeaseInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/leases/${leaseId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong");
        return;
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mb-6">
      <p className="mb-3 text-sm font-medium text-slate-900">Digital signatures</p>
      <p className="mb-3 text-xs text-slate-400">
        A typed name is not a handwritten or notarized signature — it records consent with a timestamp
        and IP address as an audit trail, alongside the uploaded paper agreement if you have one.
      </p>

      {signatures.length === 0 ? (
        <p className="text-sm text-slate-500">No one has signed digitally yet.</p>
      ) : (
        <ul className="mb-3 space-y-2 text-sm">
          {signatures.map((s) => (
            <li key={s.id} className="flex items-center justify-between border-t border-slate-100 pt-2 first:border-0 first:pt-0">
              <span className="text-slate-700">
                {ROLE_LABELS[s.signerRole] ?? s.signerRole} — <span className="font-medium">{s.typedName}</span>
              </span>
              <span className="text-xs text-slate-400">{new Date(s.signedAt).toLocaleString("en-UG")}</span>
            </li>
          ))}
        </ul>
      )}

      {canSign && (
        <form className="space-y-3 border-t border-slate-100 pt-3" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Input placeholder="Type your full legal name" {...register("typedName")} />
            <FieldError message={errors.typedName?.message} />
          </div>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" className="mt-0.5" {...register("consent")} />
            <span>I confirm that typing my name above constitutes my electronic signature on this lease.</span>
          </label>
          <FieldError message={errors.consent?.message} />
          {serverError && <p className="text-sm text-red-600">{serverError}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Signing…" : `Sign as ${ROLE_LABELS[signAsRole]}`}
          </Button>
        </form>
      )}
    </Card>
  );
}
