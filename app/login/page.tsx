"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button, Card, FieldError, Input, Label } from "@/components/ui";
import { GoogleSignInButton } from "@/components/forms/google-signin-button";

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [needsTotp, setNeedsTotp] = useState(false);
  const [totpCode, setTotpCode] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function signInWithCredentials(phone: string, password: string, code?: string) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await signIn("credentials", {
        phone,
        password,
        totpCode: code ?? "",
        redirect: false,
      });

      if (res?.error) {
        if (res.error === "2FA_REQUIRED") {
          setNeedsTotp(true);
          return;
        }
        if (res.error === "Invalid two-factor code") {
          setServerError(res.error);
          return;
        }
        setServerError(
          res.error.includes("Too many") || res.error.includes("suspended")
            ? res.error
            : "Incorrect phone number or password"
        );
        return;
      }

      const session = await getSession();
      const role = session?.user?.role;
      const home =
        !role
          ? "/onboarding"
          : role === "LANDLORD" || role === "PROPERTY_MANAGER"
            ? "/landlord/dashboard"
            : role === "CARETAKER"
              ? "/caretaker/dashboard"
              : role === "ADMIN" || role === "SUPER_ADMIN"
                ? "/admin/dashboard"
                : "/tenant/dashboard";
      router.push(home);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit(data: LoginInput) {
    await signInWithCredentials(data.phone, data.password);
  }

  async function onSubmitTotp() {
    const { phone, password } = getValues();
    await signInWithCredentials(phone, password, totpCode);
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-sand px-4 py-12">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-semibold text-slate-900">Log in</h1>

        {needsTotp ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-slate-600">
              Enter the 6-digit code from your authenticator app.
            </p>
            <div>
              <Label htmlFor="totpCode">Two-factor code</Label>
              <Input
                id="totpCode"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            {serverError && <p className="text-sm text-red-600">{serverError}</p>}
            <Button
              type="button"
              className="w-full"
              disabled={submitting || totpCode.length !== 6}
              onClick={onSubmitTotp}
            >
              {submitting ? "Verifying…" : "Verify and log in"}
            </Button>
            <button
              type="button"
              className="w-full text-center text-sm text-slate-500 hover:text-slate-700"
              onClick={() => {
                setNeedsTotp(false);
                setTotpCode("");
                setServerError(null);
              }}
            >
              ← Back
            </button>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" placeholder="0771234567" {...register("phone")} />
              <FieldError message={errors.phone?.message} />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs font-medium text-ivy-700 hover:text-ivy-800">
                  Forgot password?
                </Link>
              </div>
              <Input id="password" type="password" {...register("password")} />
              <FieldError message={errors.password?.message} />
            </div>

            {serverError && <p className="text-sm text-red-600">{serverError}</p>}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Logging in…" : "Log in"}
            </Button>
          </form>
        )}

        {!needsTotp && (
          <>
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">OR</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <GoogleSignInButton />

            <p className="mt-6 text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-medium text-ivy-700 hover:text-ivy-800">
                Sign up
              </Link>
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
