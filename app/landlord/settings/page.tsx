import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui";
import { PaymentPreferencesForm } from "@/components/forms/payment-preferences-form";
import { WhatsAppNumberForm } from "@/components/forms/whatsapp-number-form";
import { LANDLORD_NAV } from "@/lib/landlord-nav";
import { getUserAuditLogs } from "@/lib/data";

const ACTION_LABELS: Record<string, string> = {
  "property.delete": "Deleted a property",
  "lease.end": "Ended a lease",
  "lease.deposit-refunded": "Marked a deposit refunded",
  "payment.record-cash": "Recorded a cash payment",
  "document.verify": "Verified a tenant document",
  "document.unverify": "Un-verified a tenant document",
  "caretaker.appoint": "Appointed a caretaker",
  "caretaker.remove": "Removed a caretaker",
};

export default async function LandlordSettingsPage() {
  const user = await requireUser("LANDLORD");
  const fullUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  const auditLogs = await getUserAuditLogs(user.id);

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

      <div className="mt-6">
        <WhatsAppNumberForm currentNumber={fullUser.whatsappNumber} />
      </div>

      <Card className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-slate-900">Activity log</h2>
        {auditLogs.length === 0 ? (
          <p className="text-sm text-slate-500">No sensitive actions recorded yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {auditLogs.map((log) => (
              <li key={log.id} className="flex items-center justify-between border-t border-slate-100 pt-2 first:border-0 first:pt-0">
                <span className="text-slate-700">{ACTION_LABELS[log.action] ?? log.action}</span>
                <span className="text-xs text-slate-400">
                  {new Date(log.createdAt).toLocaleString("en-UG")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </DashboardShell>
  );
}
