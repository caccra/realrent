"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { TAXPAYER_TYPES } from "@/lib/validations/taxpayer-type";

type TaxpayerType = (typeof TAXPAYER_TYPES)[number]["value"];

export function TaxpayerTypeForm({ currentType }: { currentType: TaxpayerType }) {
  const router = useRouter();
  const [value, setValue] = useState<TaxpayerType>(currentType);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(next: TaxpayerType) {
    setValue(next);
    setSubmitting(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/settings/taxpayer-type", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taxpayerType: next }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        setValue(currentType);
        return;
      }
      setSaved(true);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <p className="text-sm font-medium text-slate-900">Rental tax filing type</p>
      <p className="mt-1 text-sm text-slate-500">
        Individual rental tax is a separate URA schedule from how a company or trust reports rental income — this
        changes how your rental tax summary is labeled.
      </p>
      <div className="mt-3 space-y-2">
        {TAXPAYER_TYPES.map((t) => (
          <label key={t.value} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="taxpayerType"
              checked={value === t.value}
              disabled={submitting}
              onChange={() => save(t.value)}
            />
            {t.label}
          </label>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {saved && !submitting && <p className="mt-2 text-sm text-ivy-700">Saved.</p>}
    </Card>
  );
}
