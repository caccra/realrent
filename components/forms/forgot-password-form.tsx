"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { Button, Card, FieldError, Input, Label } from "@/components/ui";

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(data: ForgotPasswordInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong");
        return;
      }
      setSent(true);
      setDevResetUrl(body.devResetUrl ?? null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <h1 className="text-xl font-semibold text-slate-900">Reset your password</h1>
      <p className="mt-1 text-sm text-slate-500">
        Enter the phone number on your account and we&apos;ll send you a reset link.
      </p>

      {sent ? (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-slate-700">
            If an account exists for that number, a reset link has been sent.
          </p>
          {devResetUrl && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-medium text-amber-800">
                No SMS provider is configured yet, so here&apos;s your reset link for testing:
              </p>
              <Link href={devResetUrl} className="mt-1 block break-all text-xs text-ivy-700 underline">
                {devResetUrl}
              </Link>
            </div>
          )}
        </div>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" placeholder="0771234567" {...register("phone")} />
            <FieldError message={errors.phone?.message} />
          </div>

          {serverError && <p className="text-sm text-red-600">{serverError}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/login" className="font-medium text-ivy-700 hover:text-ivy-800">
          Back to log in
        </Link>
      </p>
    </Card>
  );
}
