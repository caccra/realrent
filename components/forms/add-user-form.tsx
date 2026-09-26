"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createUserSchema, type CreateUserInput } from "@/lib/validations/admin";
import { Button, Card, FieldError, Input, Label, Select, SecondaryButton } from "@/components/ui";
import { formatPhoneForDisplay } from "@/lib/phone";

export function AddUserForm({ roleOptions }: { roleOptions: readonly { value: string; label: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ name: string; phone: string; tempPassword: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: roleOptions[0]?.value as CreateUserInput["role"] },
  });

  async function onSubmit(data: CreateUserInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong");
        return;
      }
      setCreated({ name: body.name, phone: body.phone, tempPassword: body.tempPassword });
      reset();
      setOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-6">
      {created && (
        <Card className="mb-3 border-ivy-200 bg-ivy-50">
          <p className="text-sm text-ivy-900">
            Created <strong>{created.name}</strong>&apos;s account ({formatPhoneForDisplay(created.phone)}).
            Share this temporary password with them so they can log in:{" "}
            <span className="font-mono font-semibold">{created.tempPassword}</span>
          </p>
        </Card>
      )}

      {!open ? (
        <Button onClick={() => setOpen(true)}>Add user</Button>
      ) : (
        <Card>
          <h3 className="mb-3 text-sm font-medium text-slate-900">Add a new account</h3>
          <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" {...register("name")} />
                <FieldError message={errors.name?.message} />
              </div>
              <div>
                <Label htmlFor="phone">Phone number</Label>
                <Input id="phone" placeholder="0771234567" {...register("phone")} />
                <FieldError message={errors.phone?.message} />
              </div>
              <div>
                <Label htmlFor="email">Email (optional)</Label>
                <Input id="email" type="email" {...register("email")} />
                <FieldError message={errors.email?.message} />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select id="role" {...register("role")}>
                  {roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            {serverError && <p className="text-sm text-red-600">{serverError}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create account"}
              </Button>
              <SecondaryButton type="button" onClick={() => setOpen(false)}>
                Cancel
              </SecondaryButton>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
