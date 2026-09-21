"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { reviewSchema, type ReviewFormInput, type ReviewInput } from "@/lib/validations/review";
import { Button, Card, Textarea } from "@/components/ui";

export function ReviewForm({
  leaseId,
  title,
  defaultValues,
}: {
  leaseId: string;
  title: string;
  defaultValues?: ReviewInput;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(!defaultValues);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ReviewFormInput, unknown, ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: defaultValues ?? { rating: 0, comment: "" },
  });

  const watchedRating = useWatch({ control, name: "rating" });
  const rating = Number(watchedRating) || 0;

  async function onSubmit(data: ReviewInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/leases/${leaseId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong");
        return;
      }
      setEditing(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (!editing && defaultValues) {
    return (
      <Card>
        <p className="mb-1 text-sm font-medium text-slate-900">{title}</p>
        <div className="flex items-center gap-2">
          <StarPicker value={defaultValues.rating} onChange={() => {}} readOnly />
        </div>
        {defaultValues.comment && <p className="mt-2 text-sm text-slate-600">{defaultValues.comment}</p>}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          Edit review
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <p className="mb-2 text-sm font-medium text-slate-900">{title}</p>
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" {...register("rating")} />
        <StarPicker value={rating} onChange={(n) => setValue("rating", n, { shouldValidate: true })} />
        {errors.rating && <p className="text-sm text-red-600">{errors.rating.message}</p>}

        <Textarea rows={2} placeholder="Leave a comment (optional)" {...register("comment")} />

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : defaultValues ? "Update review" : "Submit review"}
        </Button>
      </form>
    </Card>
  );
}

function StarPicker({
  value,
  onChange,
  readOnly,
}: {
  value: number;
  onChange: (n: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange(n)}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          className={readOnly ? "cursor-default" : "cursor-pointer"}
        >
          <svg
            viewBox="0 0 20 20"
            className={`h-6 w-6 ${n <= value ? "fill-amber-400" : "fill-slate-200"}`}
            aria-hidden="true"
          >
            <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z" />
          </svg>
        </button>
      ))}
    </div>
  );
}
