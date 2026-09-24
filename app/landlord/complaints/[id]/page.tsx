import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getComplaintDetail } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { ComplaintDetailView } from "@/components/complaint-detail-view";
import { navForRole } from "@/lib/landlord-nav";
import { canManageProperty } from "@/lib/authorization";

export default async function LandlordComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(["LANDLORD", "PROPERTY_MANAGER"]);

  const complaint = await getComplaintDetail(id);
  if (!complaint || !(await canManageProperty(user.id, user.role, complaint.lease.unit.propertyId))) {
    notFound();
  }

  return (
    <DashboardShell title={complaint.title} userName={user.name ?? ""} nav={navForRole(user.role)}>
      <ComplaintDetailView complaint={complaint} leaseHref={`/landlord/leases/${complaint.leaseId}`} />
    </DashboardShell>
  );
}
