"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { onboardingSchema, type OnboardingInput } from "@/lib/validations/onboarding";
import { Button, FieldError, Input, Label, Select } from "@/components/ui";

const roleHome: Record<string, string> = {
  LANDLORD: "/landlord/dashboard",
  TENANT: "/tenant/dashboard",
  CARETAKER: "/caretaker/dashboard",
  PROPERTY_MANAGER: "/landlord/dashboard",
};

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { name: defaultName, role: "TENANT" },
  });

  async function onSubmit(data: OnboardingInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong");
        return;
      }

      await update();
      router.push(roleHome[body.role] ?? "/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Label htmlFor="role">I am a</Label>
        <Select id="role" {...register("role")}>
          <option value="LANDLORD">Landlord</option>
          <option value="TENANT">Tenant</option>
          <option value="PROPERTY_MANAGER">Property manager</option>
          <option value="CARETAKER">Caretaker</option>
        </Select>
      </div>

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

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}
