"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { expenseSchema, EXPENSE_CATEGORIES, type ExpenseFormInput, type ExpenseInput } from "@/lib/validations/expense";
import { Button, Card, FieldError, Input, Label, Select, SecondaryButton, Badge } from "@/components/ui";
import { formatMoney, type Currency } from "@/lib/money";

type Expense = {
  id: string;
  category: string;
  description: string | null;
  amount: unknown;
  currency: string;
  vendor: string | null;
  incurredAt: string | Date;
  receiptUrl: string | null;
  recordedBy: { name: string } | null;
};

export function ExpenseSection({ propertyId, expenses }: { propertyId: string; expenses: Expense[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormInput, unknown, ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { category: "UTILITIES", currency: "UGX" },
  });

  async function onSubmit(data: ExpenseInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("category", data.category);
      formData.append("description", data.description ?? "");
      formData.append("amount", String(data.amount));
      formData.append("currency", data.currency);
      formData.append("vendor", data.vendor ?? "");
      formData.append("incurredAt", data.incurredAt);
      const fileInput = document.getElementById("expenseReceipt") as HTMLInputElement | null;
      if (fileInput?.files?.[0]) formData.append("receipt", fileInput.files[0]);

      const res = await fetch(`/api/properties/${propertyId}/expenses`, { method: "POST", body: formData });
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

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-medium text-slate-900">Expenses</h2>
        {!open && <Button onClick={() => setOpen(true)}>Record expense</Button>}
      </div>

      {open && (
        <form className="mb-4 space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select id="category" {...register("category")}>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="incurredAt">Date</Label>
              <Input id="incurredAt" type="date" {...register("incurredAt")} />
              <FieldError message={errors.incurredAt?.message} />
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" min={0} step="0.01" {...register("amount")} />
              <FieldError message={errors.amount?.message} />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select id="currency" {...register("currency")}>
                <option value="UGX">UGX</option>
                <option value="USD">USD</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="vendor">Vendor (optional)</Label>
              <Input id="vendor" placeholder="e.g. Umeme, ABC Security" {...register("vendor")} />
            </div>
            <div>
              <Label htmlFor="expenseReceipt">Receipt (optional)</Label>
              <input
                id="expenseReceipt"
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input id="description" placeholder="e.g. September water bill" {...register("description")} />
            </div>
          </div>
          {serverError && <p className="text-sm text-red-600">{serverError}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save expense"}
            </Button>
            <SecondaryButton type="button" onClick={() => setOpen(false)}>
              Cancel
            </SecondaryButton>
          </div>
        </form>
      )}

      {expenses.length === 0 ? (
        <p className="text-sm text-slate-500">No expenses recorded for this property yet.</p>
      ) : (
        <ul className="space-y-2">
          {expenses.map((e) => (
            <li key={e.id} className="flex items-center justify-between border-t border-slate-100 pt-2 text-sm first:border-0 first:pt-0">
              <div>
                <span className="flex items-center gap-2">
                  <Badge>{EXPENSE_CATEGORIES.find((c) => c.value === e.category)?.label ?? e.category}</Badge>
                  <span className="text-slate-900">{formatMoney(e.amount as string, e.currency as Currency)}</span>
                  {e.vendor && <span className="text-slate-500">· {e.vendor}</span>}
                </span>
                <p className="mt-0.5 text-xs text-slate-400">
                  {new Date(e.incurredAt).toLocaleDateString("en-UG")}
                  {e.description && ` · ${e.description}`}
                  {e.recordedBy && ` · recorded by ${e.recordedBy.name}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {e.receiptUrl && (
                  <a
                    href={e.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-ivy-700 hover:text-ivy-800"
                  >
                    Receipt
                  </a>
                )}
                <SecondaryButton
                  className="text-xs text-red-700"
                  onClick={() => handleDelete(e.id)}
                  disabled={deletingId === e.id}
                >
                  {deletingId === e.id ? "…" : "Delete"}
                </SecondaryButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
