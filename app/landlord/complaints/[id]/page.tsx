import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getComplaintDetail } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { ComplaintDetailView } from "@/components/complaint-detail-view";
import { LANDLORD_NAV } from "@/lib/landlord-nav";

export default async function LandlordComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser("LANDLORD");

  const complaint = await getComplaintDetail(id);
  if (!complaint || complaint.lease.unit.property.landlordId !== user.id) {
    notFound();
  }

  return (
    <DashboardShell title={complaint.title} userName={user.name ?? ""} nav={LANDLORD_NAV}>
      <ComplaintDetailView complaint={complaint} leaseHref={`/landlord/leases/${complaint.leaseId}`} />
    </DashboardShell>
  );
}
