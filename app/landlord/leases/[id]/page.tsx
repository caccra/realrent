import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getLeaseWithDetails, getTenantScreeningReport } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { LeaseDetailView } from "@/components/lease-detail-view";
import { navForRole } from "@/lib/landlord-nav";
import { canManageProperty } from "@/lib/authorization";

export default async function LeaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(["LANDLORD", "PROPERTY_MANAGER"]);

  const lease = await getLeaseWithDetails(id);
  if (!lease || !(await canManageProperty(user.id, user.role, lease.unit.propertyId))) {
    notFound();
  }

  const screeningReport = await getTenantScreeningReport(lease.tenantId);

  return (
    <DashboardShell
      title={`${lease.unit.property.name} — ${lease.unit.label}`}
      userName={user.name ?? ""}
      nav={navForRole(user.role)}
    >
      <LeaseDetailView
        lease={lease}
        canEndLease
        canReviewTenant
        agreementHref={`/landlord/leases/${lease.id}/agreement`}
        screeningReport={screeningReport}
      />
    </DashboardShell>
  );
}
