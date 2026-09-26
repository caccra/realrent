import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { getUserAdminDetail } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge, Card } from "@/components/ui";
import { formatPhoneForDisplay } from "@/lib/phone";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { AdminUserRoleForm } from "@/components/forms/admin-user-role-form";
import { AdminSuspendUserButton } from "@/components/forms/admin-suspend-user-button";
import { AdminEditUserForm } from "@/components/forms/admin-edit-user-form";
import { AdminDeleteUserButton } from "@/components/forms/admin-delete-user-button";

const ACTION_LABELS: Record<string, string> = {
  "property.delete": "Deleted a property",
  "lease.end": "Ended a lease",
  "lease.deposit-refunded": "Marked a deposit refunded",
  "payment.record-cash": "Recorded a cash payment",
  "document.verify": "Verified a tenant document",
  "document.unverify": "Un-verified a tenant document",
  "caretaker.appoint": "Appointed a caretaker",
  "caretaker.remove": "Removed a caretaker",
  "property-manager.appoint": "Appointed a property manager",
  "property-manager.remove": "Removed a property manager",
  "admin.set-role": "Role changed by an admin",
  "admin.suspend-user": "Account suspended",
  "admin.unsuspend-user": "Account restored",
  "admin.create-user": "Account created by an admin",
  "admin.edit-user": "Profile edited by an admin",
  "admin.delete-user": "Account deleted by an admin",
  "admin.create-property": "Property added by an admin",
  "admin.activate-property": "Property reactivated by an admin",
  "admin.deactivate-property": "Property hidden by an admin",
};

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdmin();
  const isSuperAdmin = admin.role === "SUPER_ADMIN";

  const detail = await getUserAdminDetail(id);
  if (!detail) {
    notFound();
  }
  const { user, auditLogs } = detail;

  return (
    <DashboardShell title={user.name} userName={admin.name ?? ""} nav={ADMIN_NAV}>
      <Link href="/admin/users" className="mb-4 inline-block text-sm text-ivy-700 hover:text-ivy-800">
        ← All users
      </Link>

      <Card className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">
              {user.phone ? formatPhoneForDisplay(user.phone) : "—"}
              {user.email && ` · ${user.email}`}
            </p>
            <div className="mt-2 flex gap-2">
              <Badge>{user.role ?? "Unassigned"}</Badge>
              {user.suspended ? <Badge tone="red">Suspended</Badge> : <Badge tone="green">Active</Badge>}
            </div>
            {user.suspended && user.suspendedReason && (
              <p className="mt-2 text-sm text-red-700">Reason: {user.suspendedReason}</p>
            )}
          </div>
          {isSuperAdmin && id !== admin.id && (
            <div className="flex flex-col items-end gap-3">
              <AdminUserRoleForm userId={user.id} currentRole={user.role ?? ""} />
              <div className="flex gap-2">
                <AdminSuspendUserButton userId={user.id} suspended={user.suspended} />
                <AdminDeleteUserButton userId={user.id} name={user.name} />
              </div>
            </div>
          )}
        </div>
        {isSuperAdmin && id !== admin.id && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <AdminEditUserForm
              userId={user.id}
              defaultValues={{ name: user.name, phone: user.phone ?? "", email: user.email ?? "" }}
            />
          </div>
        )}
      </Card>

      {user.properties.length > 0 && (
        <Card className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-slate-900">Properties ({user.properties.length})</h2>
          <ul className="space-y-1 text-sm">
            {user.properties.map((p) => (
              <li key={p.id} className="flex items-center justify-between">
                <span className="text-slate-700">{p.name}</span>
                <span className="text-slate-500">
                  {p.listingType === "SALE" ? "For sale" : `${p._count.units} unit(s)`}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {user.leasesAsTenant.length > 0 && (
        <Card className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-slate-900">Leases ({user.leasesAsTenant.length})</h2>
          <ul className="space-y-1 text-sm">
            {user.leasesAsTenant.map((l) => (
              <li key={l.id} className="flex items-center justify-between">
                <span className="text-slate-700">
                  {l.unit.property.name} — {l.unit.label}
                </span>
                <Badge tone={l.status === "ACTIVE" ? "green" : "slate"}>{l.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {user.propertyManagerAssignments.length > 0 && (
        <Card className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-slate-900">
            Property manager of ({user.propertyManagerAssignments.length})
          </h2>
          <ul className="space-y-1 text-sm text-slate-700">
            {user.propertyManagerAssignments.map((a) => (
              <li key={a.id}>{a.property.name}</li>
            ))}
          </ul>
        </Card>
      )}

      {user.caretakerAssignments.length > 0 && (
        <Card className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-slate-900">
            Caretaker of ({user.caretakerAssignments.length})
          </h2>
          <ul className="space-y-1 text-sm text-slate-700">
            {user.caretakerAssignments.map((a) => (
              <li key={a.id}>{a.property.name}</li>
            ))}
          </ul>
        </Card>
      )}

      {user.documents.length > 0 && (
        <Card className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-slate-900">Documents ({user.documents.length})</h2>
          <ul className="space-y-1 text-sm">
            {user.documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between">
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-ivy-700 hover:text-ivy-800">
                  {d.type}
                  {d.label && ` — ${d.label}`}
                </a>
                <Badge tone={d.verified ? "green" : "slate"}>{d.verified ? "Verified" : "Unverified"}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-sm font-medium text-slate-900">Recent activity</h2>
        {auditLogs.length === 0 ? (
          <p className="text-sm text-slate-500">No recorded activity.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {auditLogs.map((log) => (
              <li key={log.id} className="flex items-center justify-between border-t border-slate-100 pt-2 first:border-0 first:pt-0">
                <span className="text-slate-700">{ACTION_LABELS[log.action] ?? log.action}</span>
                <span className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString("en-UG")}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </DashboardShell>
  );
}
