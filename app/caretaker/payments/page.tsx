import { requireUser } from "@/lib/session";
import { getCaretakerPayments, getCaretakerTenants } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { PaymentStatusOverview } from "@/components/payment-status-overview";
import { PaymentsLedger } from "@/components/payments-ledger";
import { CARETAKER_NAV } from "@/lib/caretaker-nav";

export default async function CaretakerPaymentsPage() {
  const user = await requireUser("CARETAKER");
  const [leases, payments] = await Promise.all([
    getCaretakerTenants(user.id),
    getCaretakerPayments(user.id),
  ]);

  return (
    <DashboardShell title="Payments" userName={user.name ?? ""} nav={CARETAKER_NAV}>
      <h2 className="mb-3 text-lg font-medium text-slate-900">Who&apos;s paid, who hasn&apos;t</h2>
      <PaymentStatusOverview leases={leases} leaseHrefPrefix="/caretaker/leases" />

      <h2 className="mb-3 mt-8 text-lg font-medium text-slate-900">All payments</h2>
      <PaymentsLedger payments={payments} leaseHrefPrefix="/caretaker/leases" />
    </DashboardShell>
  );
}
