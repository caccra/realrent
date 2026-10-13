import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/components/forms/register-form";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a free Kezavi account as a landlord, tenant, property manager, or caretaker.",
  alternates: { canonical: "/register" },
};

export default function RegisterPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-sand px-4 py-12">
      <Suspense>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
