"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { updateUserProfileSchema, type UpdateUserProfileInput } from "@/lib/validations/admin";
import { Button, Card, FieldError, Input, Label, SecondaryButton } from "@/components/ui";
import { formatPhoneForDisplay } from "@/lib/phone";

export function AdminEditUserForm({
  userId,
  defaultValues,
}: {
  userId: string;
  defaultValues: { name: string; phone: string; email: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateUserProfileInput>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: { ...defaultValues, phone: formatPhoneForDisplay(defaultValues.phone) },
  });

  async function onSubmit(data: UpdateUserProfileInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "edit-profile", ...data }),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong");
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <SecondaryButton onClick={() => setOpen(true)}>Edit profile</SecondaryButton>
    );
  }

  return (
    <Card>
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Label htmlFor="editName">Full name</Label>
          <Input id="editName" {...register("name")} />
          <FieldError message={errors.name?.message} />
        </div>
        <div>
          <Label htmlFor="editPhone">Phone number</Label>
          <Input id="editPhone" {...register("phone")} />
          <FieldError message={errors.phone?.message} />
        </div>
        <div>
          <Label htmlFor="editEmail">Email (optional)</Label>
          <Input id="editEmail" type="email" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save changes"}
          </Button>
          <SecondaryButton type="button" onClick={() => setOpen(false)}>
            Cancel
          </SecondaryButton>
        </div>
      </form>
    </Card>
  );
}
