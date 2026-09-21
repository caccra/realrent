import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getComplaintDetail } from "@/lib/data";
import { canManageProperty } from "@/lib/authorization";
import { DashboardShell } from "@/components/dashboard-shell";
import { ComplaintDetailView } from "@/components/complaint-detail-view";
import { CARETAKER_NAV } from "@/lib/caretaker-nav";

export default async function CaretakerComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser("CARETAKER");

  const complaint = await getComplaintDetail(id);
  if (
    !complaint ||
    !(await canManageProperty(user.id, user.role, complaint.lease.unit.propertyId))
  ) {
    notFound();
  }

  return (
    <DashboardShell title={complaint.title} userName={user.name ?? ""} nav={CARETAKER_NAV}>
      <ComplaintDetailView complaint={complaint} leaseHref={`/caretaker/leases/${complaint.leaseId}`} />
    </DashboardShell>
  );
}
