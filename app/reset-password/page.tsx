import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-sand px-4 py-12">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
