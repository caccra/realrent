import { requireAdmin } from "@/lib/session";
import { getAllMaintenanceAdmin } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { MaintenanceList } from "@/components/maintenance-list";
import { ADMIN_NAV } from "@/lib/admin-nav";

export default async function AdminMaintenancePage() {
  const user = await requireAdmin();
  const requests = await getAllMaintenanceAdmin();

  return (
    <DashboardShell title="Maintenance" userName={user.name ?? ""} nav={ADMIN_NAV}>
      <p className="mb-4 text-sm text-slate-500">{requests.length} most recent, across all properties.</p>
      <MaintenanceList requests={requests} />
    </DashboardShell>
  );
}
