import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { getAllUsersAdmin } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge, Card } from "@/components/ui";
import { formatPhoneForDisplay } from "@/lib/phone";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { SearchFilterBox } from "@/components/search-filter-box";
import { AddUserForm } from "@/components/forms/add-user-form";
import { ADMIN_CREATABLE_ROLES, SUPER_ADMIN_CREATABLE_ROLES } from "@/lib/validations/admin";

export default async function AdminUsersPage() {
  const user = await requireAdmin();
  const users = await getAllUsersAdmin();
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  return (
    <DashboardShell title="Users" userName={user.name ?? ""} nav={ADMIN_NAV}>
      <p className="mb-4 text-sm text-slate-500">{users.length} most recent accounts.</p>
      <AddUserForm roleOptions={isSuperAdmin ? SUPER_ADMIN_CREATABLE_ROLES : ADMIN_CREATABLE_ROLES} />
      <SearchFilterBox containerId="admin-users-body" placeholder="Search by name, phone, or email…" />
      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Phone</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Joined</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody id="admin-users-body" className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr
                key={u.id}
                data-search-text={`${u.name} ${u.phone ?? ""} ${u.email ?? ""}`.toLowerCase()}
              >
                <td className="px-4 py-2 text-slate-900">{u.name}</td>
                <td className="px-4 py-2 text-slate-600">{u.phone ? formatPhoneForDisplay(u.phone) : "—"}</td>
                <td className="px-4 py-2">
                  <Badge>{u.role ?? "Unassigned"}</Badge>
                </td>
                <td className="px-4 py-2">
                  {u.suspended ? <Badge tone="red">Suspended</Badge> : <Badge tone="green">Active</Badge>}
                </td>
                <td className="px-4 py-2 text-slate-500">{new Date(u.createdAt).toLocaleDateString("en-UG")}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/admin/users/${u.id}`} className="font-medium text-ivy-700 hover:text-ivy-800">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </DashboardShell>
  );
}
