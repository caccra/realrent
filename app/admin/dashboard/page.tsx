import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { getAdminOverviewStats } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge, Card } from "@/components/ui";
import { formatMoney, type Currency } from "@/lib/money";
import { formatPhoneForDisplay } from "@/lib/phone";
import { ADMIN_NAV } from "@/lib/admin-nav";

/** Platform revenue can span both currencies; joins them rather than summing raw numbers. */
function formatByCurrency(entries: { currency: string; amount: number }[]): string {
  if (entries.length === 0) return formatMoney(0, "UGX");
  return entries.map((e) => formatMoney(e.amount, e.currency as Currency)).join(" + ");
}

const ROLE_LABELS: Record<string, string> = {
  LANDLORD: "Landlords",
  TENANT: "Tenants",
  PROPERTY_MANAGER: "Property managers",
  CARETAKER: "Caretakers",
  ADMIN: "Admins",
  SUPER_ADMIN: "Super Admins",
  UNASSIGNED: "Unassigned",
};

export default async function AdminDashboardPage() {
  const user = await requireAdmin();
  const stats = await getAdminOverviewStats();

  return (
    <DashboardShell title="Admin Dashboard" userName={user.name ?? ""} nav={ADMIN_NAV}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-500">Total users</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.totalUsers}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Properties</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.totalProperties}</p>
          <p className="mt-1 text-xs text-slate-400">
            {stats.rentalPropertyCount} rental · {stats.salePropertyCount} for sale
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Active leases</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.activeLeaseCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Revenue this month</p>
          <p className="mt-1 text-2xl font-semibold text-ivy-700">
            {formatByCurrency(stats.revenueThisMonthByCurrency)}
          </p>
          <p className="mt-1 text-xs text-slate-400">{formatByCurrency(stats.totalRevenueByCurrency)} all-time</p>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/admin/complaints">
          <Card className="hover:border-ivy-300">
            <p className="text-sm text-slate-500">Open complaints</p>
            <p className="mt-1 text-2xl font-semibold text-red-700">{stats.openComplaintCount}</p>
          </Card>
        </Link>
        <Link href="/admin/maintenance">
          <Card className="hover:border-ivy-300">
            <p className="text-sm text-slate-500">Open maintenance requests</p>
            <p className="mt-1 text-2xl font-semibold text-amber-700">{stats.openMaintenanceCount}</p>
          </Card>
        </Link>
      </div>

      <Card className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-slate-900">Users by role</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.roleCounts).map(([role, count]) => (
            <Badge key={role}>
              {ROLE_LABELS[role] ?? role}: {count}
            </Badge>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-900">Recent signups</h2>
          <Link href="/admin/users" className="text-sm font-medium text-ivy-700 hover:text-ivy-800">
            View all users →
          </Link>
        </div>
        <ul className="divide-y divide-slate-100">
          {stats.recentUsers.map((u) => (
            <li key={u.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-900">{u.name}</span>
              <span className="text-slate-500">{u.phone ? formatPhoneForDisplay(u.phone) : "—"}</span>
              <Badge>{u.role ?? "Unassigned"}</Badge>
              <span className="text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString("en-UG")}</span>
            </li>
          ))}
        </ul>
      </Card>
    </DashboardShell>
  );
}
