"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  complaintUpdateSchema,
  type ComplaintUpdateInput,
} from "@/lib/validations/complaint";
import { Button, Card, FieldError, Label, Select, Textarea } from "@/components/ui";

export function ComplaintStatusForm({
  complaintId,
  defaultValues,
}: {
  complaintId: string;
  defaultValues: ComplaintUpdateInput;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ComplaintUpdateInput>({
    resolver: zodResolver(complaintUpdateSchema),
    defaultValues,
  });

  async function onSubmit(data: ComplaintUpdateInput) {
    setServerError(null);
    setSaved(false);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong");
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
      <h2 className="mb-3 text-base font-medium text-slate-900">Update status</h2>
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" {...register("status")}>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="resolutionNote">Note (optional)</Label>
          <Textarea id="resolutionNote" rows={3} {...register("resolutionNote")} />
          <FieldError message={errors.resolutionNote?.message} />
        </div>
        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        {saved && !serverError && <p className="text-sm text-ivy-700">Saved.</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save"}
        </Button>
      </form>
    </Card>
  );
}
