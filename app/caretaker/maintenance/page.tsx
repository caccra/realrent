import { requireUser } from "@/lib/session";
import { getCaretakerAssignments, getCaretakerMaintenanceRequests } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { NewMaintenanceRequestForm } from "@/components/forms/new-maintenance-request-form";
import { MaintenanceList } from "@/components/maintenance-list";
import { CARETAKER_NAV } from "@/lib/caretaker-nav";

export default async function CaretakerMaintenancePage() {
  const user = await requireUser("CARETAKER");
  const [requests, assignments] = await Promise.all([
    getCaretakerMaintenanceRequests(user.id),
    getCaretakerAssignments(user.id),
  ]);

  const propertyOptions = assignments.map(({ property }) => ({
    id: property.id,
    name: property.name,
    units: property.units.map((u) => ({ id: u.id, label: u.label })),
  }));

  return (
    <DashboardShell title="Maintenance" userName={user.name ?? ""} nav={CARETAKER_NAV}>
      <NewMaintenanceRequestForm properties={propertyOptions} />
      <MaintenanceList requests={requests} />
    </DashboardShell>
  );
}
