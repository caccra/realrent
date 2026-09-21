"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { Button, Card, FieldError, Input, Label, Select } from "@/components/ui";
import { GoogleSignInButton } from "@/components/forms/google-signin-button";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") === "TENANT" ? "TENANT" : "LANDLORD";
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: defaultRole },
  });

  async function onSubmit(data: RegisterInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong");
        return;
      }

      const signInRes = await signIn("credentials", {
        phone: data.phone,
        password: data.password,
        redirect: false,
      });

      if (signInRes?.error) {
        router.push("/login");
        return;
      }

      router.push(data.role === "LANDLORD" ? "/landlord/dashboard" : "/tenant/dashboard");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <h1 className="text-xl font-semibold text-slate-900">Create your account</h1>
      <p className="mt-1 text-sm text-slate-500">Free for landlords and tenants.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Label htmlFor="role">I am a</Label>
          <Select id="role" {...register("role")}>
            <option value="LANDLORD">Landlord</option>
            <option value="TENANT">Tenant</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="Jane Nakato" {...register("name")} />
          <FieldError message={errors.name?.message} />
        </div>

        <div>
          <Label htmlFor="phone">Phone number</Label>
          <Input id="phone" placeholder="0771234567" {...register("phone")} />
          <FieldError message={errors.phone?.message} />
        </div>

        <div>
          <Label htmlFor="email">Email (optional)</Label>
          <Input id="email" type="email" placeholder="jane@example.com" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...register("password")} />
          <FieldError message={errors.password?.message} />
        </div>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">OR</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <GoogleSignInButton />

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-emerald-700 hover:text-emerald-800">
          Log in
        </Link>
      </p>
    </Card>
  );
}
