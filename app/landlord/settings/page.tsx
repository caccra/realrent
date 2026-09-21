import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard-shell";
import { PaymentPreferencesForm } from "@/components/forms/payment-preferences-form";
import { LANDLORD_NAV } from "@/lib/landlord-nav";

export default async function LandlordSettingsPage() {
  const user = await requireUser("LANDLORD");
  const fullUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });

  return (
    <DashboardShell title="Settings" userName={user.name ?? ""} nav={LANDLORD_NAV}>
      <PaymentPreferencesForm
        defaultValues={{
          acceptsCash: fullUser.acceptsCash,
          acceptsMobileMoney: fullUser.acceptsMobileMoney,
          momoProvider: (fullUser.momoProvider as "MTN" | "AIRTEL" | null) ?? "",
          momoNumber: fullUser.momoNumber ?? "",
          acceptsBankTransfer: fullUser.acceptsBankTransfer,
          bankName: fullUser.bankName ?? "",
          bankAccountName: fullUser.bankAccountName ?? "",
          bankAccountNumber: fullUser.bankAccountNumber ?? "",
        }}
      />
    </DashboardShell>
  );
}
