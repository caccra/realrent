import { requireAdmin } from "@/lib/session";
import { getAllComplaintsAdmin } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { ComplaintsList } from "@/components/complaints-list";
import { ADMIN_NAV } from "@/lib/admin-nav";

export default async function AdminComplaintsPage() {
  const user = await requireAdmin();
  const complaints = await getAllComplaintsAdmin();

  return (
    <DashboardShell title="Complaints" userName={user.name ?? ""} nav={ADMIN_NAV}>
      <p className="mb-4 text-sm text-slate-500">{complaints.length} most recent, across all landlords.</p>
      <ComplaintsList complaints={complaints} basePath="/admin/complaints" />
    </DashboardShell>
  );
}
