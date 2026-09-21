import { requireUser } from "@/lib/session";
import { getLandlordMaintenanceRequests, getLandlordProperties } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { NewMaintenanceRequestForm } from "@/components/forms/new-maintenance-request-form";
import { MaintenanceList } from "@/components/maintenance-list";
import { LANDLORD_NAV } from "@/lib/landlord-nav";

export default async function LandlordMaintenancePage() {
  const user = await requireUser("LANDLORD");
  const [requests, properties] = await Promise.all([
    getLandlordMaintenanceRequests(user.id),
    getLandlordProperties(user.id),
  ]);

  const propertyOptions = properties.map((p) => ({
    id: p.id,
    name: p.name,
    units: p.units.map((u) => ({ id: u.id, label: u.label })),
  }));

  return (
    <DashboardShell title="Maintenance" userName={user.name ?? ""} nav={LANDLORD_NAV}>
      <NewMaintenanceRequestForm properties={propertyOptions} />
      <MaintenanceList requests={requests} />
    </DashboardShell>
  );
}
