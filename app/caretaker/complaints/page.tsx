import { requireUser } from "@/lib/session";
import { getCaretakerComplaints } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { ComplaintsList } from "@/components/complaints-list";
import { CARETAKER_NAV } from "@/lib/caretaker-nav";

export default async function CaretakerComplaintsPage() {
  const user = await requireUser("CARETAKER");
  const complaints = await getCaretakerComplaints(user.id);

  return (
    <DashboardShell title="Complaints" userName={user.name ?? ""} nav={CARETAKER_NAV}>
      <ComplaintsList complaints={complaints} basePath="/caretaker/complaints" />
    </DashboardShell>
  );
}
