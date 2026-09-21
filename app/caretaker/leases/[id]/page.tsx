import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getLeaseWithDetails } from "@/lib/data";
import { canManageProperty } from "@/lib/authorization";
import { DashboardShell } from "@/components/dashboard-shell";
import { LeaseDetailView } from "@/components/lease-detail-view";
import { CARETAKER_NAV } from "@/lib/caretaker-nav";

export default async function CaretakerLeaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser("CARETAKER");

  const lease = await getLeaseWithDetails(id);
  if (!lease || !(await canManageProperty(user.id, user.role, lease.unit.propertyId))) {
    notFound();
  }

  return (
    <DashboardShell
      title={`${lease.unit.property.name} — ${lease.unit.label}`}
      userName={user.name ?? ""}
      nav={CARETAKER_NAV}
    >
      <LeaseDetailView
        lease={lease}
        canEndLease={false}
        canReviewTenant={false}
        agreementHref={`/caretaker/leases/${lease.id}/agreement`}
      />
    </DashboardShell>
  );
}
