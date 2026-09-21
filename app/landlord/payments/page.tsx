import { requireUser } from "@/lib/session";
import { getLandlordPayments, getLandlordTenants } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { PaymentStatusOverview } from "@/components/payment-status-overview";
import { PaymentsLedger } from "@/components/payments-ledger";
import { LANDLORD_NAV } from "@/lib/landlord-nav";

export default async function LandlordPaymentsPage() {
  const user = await requireUser("LANDLORD");
  const [leases, payments] = await Promise.all([getLandlordTenants(user.id), getLandlordPayments(user.id)]);

  return (
    <DashboardShell title="Payments" userName={user.name ?? ""} nav={LANDLORD_NAV}>
      <h2 className="mb-3 text-lg font-medium text-slate-900">Who&apos;s paid, who hasn&apos;t</h2>
      <PaymentStatusOverview leases={leases} leaseHrefPrefix="/landlord/leases" />

      <h2 className="mb-3 mt-8 text-lg font-medium text-slate-900">All payments</h2>
      <PaymentsLedger payments={payments} leaseHrefPrefix="/landlord/leases" />
    </DashboardShell>
  );
}
