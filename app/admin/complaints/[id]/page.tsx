import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { getComplaintDetail } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { ComplaintDetailView } from "@/components/complaint-detail-view";
import { ADMIN_NAV } from "@/lib/admin-nav";

export default async function AdminComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdmin();

  const complaint = await getComplaintDetail(id);
  if (!complaint) {
    notFound();
  }

  return (
    <DashboardShell title="Complaint" userName={admin.name ?? ""} nav={ADMIN_NAV}>
      <ComplaintDetailView complaint={complaint} leaseHref={`/admin/users/${complaint.tenant.id}`} />
    </DashboardShell>
  );
}
