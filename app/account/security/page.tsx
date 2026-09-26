import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard-shell";
import { TwoFactorSettings } from "@/components/forms/two-factor-settings";
import { navForRole } from "@/lib/landlord-nav";
import { CARETAKER_NAV } from "@/lib/caretaker-nav";
import { ADMIN_NAV } from "@/lib/admin-nav";

const TENANT_NAV = [
  { href: "/tenant/dashboard", label: "Dashboard" },
  { href: "/account/security", label: "Security" },
];

function navForAnyRole(role: string | null | undefined) {
  if (role === "LANDLORD" || role === "PROPERTY_MANAGER") return navForRole(role);
  if (role === "CARETAKER") return CARETAKER_NAV;
  if (role === "ADMIN" || role === "SUPER_ADMIN") return ADMIN_NAV;
  return TENANT_NAV;
}

export default async function SecuritySettingsPage() {
  const user = await requireUser();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { twoFactorEnabled: true, passwordHash: true },
  });

  return (
    <DashboardShell title="Security" userName={user.name ?? ""} nav={navForAnyRole(user.role)}>
      <div className="max-w-lg">
        <TwoFactorSettings enabled={dbUser?.twoFactorEnabled ?? false} hasPassword={!!dbUser?.passwordHash} />
      </div>
    </DashboardShell>
  );
}
