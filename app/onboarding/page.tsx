import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { OnboardingForm } from "@/components/forms/onboarding-form";
import { Card } from "@/components/ui";

const roleHome: Record<string, string> = {
  LANDLORD: "/landlord/dashboard",
  TENANT: "/tenant/dashboard",
  CARETAKER: "/caretaker/dashboard",
  PROPERTY_MANAGER: "/landlord/dashboard",
};

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role) {
    redirect(roleHome[session.user.role] ?? "/");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-sand px-4 py-12">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-semibold text-slate-900">Finish setting up your account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Almost there — tell us who you are and your phone number so landlords/tenants can find
          you.
        </p>
        <OnboardingForm defaultName={session.user.name ?? ""} />
      </Card>
    </div>
  );
}
