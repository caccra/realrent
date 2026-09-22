import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { getAllAuditLogsAdmin } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { SearchFilterBox } from "@/components/search-filter-box";

const ACTION_LABELS: Record<string, string> = {
  "property.delete": "Deleted a property",
  "lease.end": "Ended a lease",
  "lease.deposit-refunded": "Marked a deposit refunded",
  "payment.record-cash": "Recorded a cash payment",
  "document.verify": "Verified a tenant document",
  "document.unverify": "Un-verified a tenant document",
  "caretaker.appoint": "Appointed a caretaker",
  "caretaker.remove": "Removed a caretaker",
  "admin.set-role": "Changed a user's role",
  "admin.suspend-user": "Suspended a user",
  "admin.unsuspend-user": "Restored a user",
};

export default async function AdminAuditLogPage() {
  const user = await requireAdmin();
  const logs = await getAllAuditLogsAdmin();

  return (
    <DashboardShell title="Audit log" userName={user.name ?? ""} nav={ADMIN_NAV}>
      <p className="mb-4 text-sm text-slate-500">{logs.length} most recent actions, platform-wide.</p>
      <SearchFilterBox containerId="admin-audit-body" placeholder="Search by user or action…" />
      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">When</th>
              <th className="px-4 py-2 font-medium">Actor</th>
              <th className="px-4 py-2 font-medium">Action</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody id="admin-audit-body" className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr
                key={log.id}
                data-search-text={`${log.user?.name ?? ""} ${log.action}`.toLowerCase()}
              >
                <td className="px-4 py-2 text-slate-500">{new Date(log.createdAt).toLocaleString("en-UG")}</td>
                <td className="px-4 py-2 text-slate-900">{log.user?.name ?? "Unknown"}</td>
                <td className="px-4 py-2 text-slate-700">{ACTION_LABELS[log.action] ?? log.action}</td>
                <td className="px-4 py-2 text-right">
                  {log.userId && (
                    <Link href={`/admin/users/${log.userId}`} className="font-medium text-emerald-700 hover:text-emerald-800">
                      View user
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </DashboardShell>
  );
}
