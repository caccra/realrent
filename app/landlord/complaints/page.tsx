import { requireUser } from "@/lib/session";
import { getLandlordComplaints } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { ComplaintsList } from "@/components/complaints-list";
import { LANDLORD_NAV } from "@/lib/landlord-nav";

export default async function LandlordComplaintsPage() {
  const user = await requireUser("LANDLORD");
  const complaints = await getLandlordComplaints(user.id);

  return (
    <DashboardShell title="Complaints" userName={user.name ?? ""} nav={LANDLORD_NAV}>
      <ComplaintsList complaints={complaints} basePath="/landlord/complaints" />
    </DashboardShell>
  );
}
