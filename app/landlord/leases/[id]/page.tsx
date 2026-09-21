import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getLeaseWithDetails } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { LeaseDetailView } from "@/components/lease-detail-view";
import { LANDLORD_NAV } from "@/lib/landlord-nav";

export default async function LeaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser("LANDLORD");

  const lease = await getLeaseWithDetails(id);
  if (!lease || lease.unit.property.landlordId !== user.id) {
    notFound();
  }

  return (
    <DashboardShell
      title={`${lease.unit.property.name} — ${lease.unit.label}`}
      userName={user.name ?? ""}
      nav={LANDLORD_NAV}
    >
      <LeaseDetailView
        lease={lease}
        canEndLease
        canReviewTenant
        agreementHref={`/landlord/leases/${lease.id}/agreement`}
      />
    </DashboardShell>
  );
}
