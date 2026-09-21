import { requireUser } from "@/lib/session";
import { DashboardShell } from "@/components/dashboard-shell";
import { AddPropertyWizard } from "@/components/forms/add-property-wizard";
import { LANDLORD_NAV } from "@/lib/landlord-nav";

export default async function NewPropertyPage() {
  const user = await requireUser("LANDLORD");

  return (
    <DashboardShell title="Add a property" userName={user.name ?? ""} nav={LANDLORD_NAV}>
      <AddPropertyWizard />
    </DashboardShell>
  );
}
