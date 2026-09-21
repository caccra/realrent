"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { Button, Card, FieldError, Input, Label } from "@/components/ui";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  async function onSubmit(data: ResetPasswordInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <p className="text-sm text-red-600">This reset link is missing a token.</p>
        <p className="mt-4 text-sm text-slate-500">
          <Link href="/forgot-password" className="font-medium text-emerald-700 hover:text-emerald-800">
            Request a new link
          </Link>
        </p>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <h1 className="text-xl font-semibold text-slate-900">Set a new password</h1>

      {done ? (
        <p className="mt-6 text-sm text-slate-700">
          Password updated. Redirecting you to log in…
        </p>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" {...register("token")} />

          <div>
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" {...register("password")} />
            <FieldError message={errors.password?.message} />
          </div>

          {serverError && <p className="text-sm text-red-600">{serverError}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Updating…" : "Update password"}
          </Button>
        </form>
      )}
    </Card>
  );
}
