import { requireAdmin } from "@/lib/session";
import { getAllContactMessages } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge, Card } from "@/components/ui";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { AdminContactResolveButton } from "@/components/forms/admin-contact-resolve-button";

export default async function AdminContactPage() {
  const user = await requireAdmin();
  const messages = await getAllContactMessages();

  return (
    <DashboardShell title="Contact messages" userName={user.name ?? ""} nav={ADMIN_NAV}>
      <p className="mb-4 text-sm text-slate-500">
        {messages.length} message{messages.length === 1 ? "" : "s"} submitted through the public Contact page.
      </p>

      {messages.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">No messages yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((m) => (
            <Card key={m.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">{m.subject}</p>
                  <p className="text-sm text-slate-500">
                    {m.name} · {m.email}
                    {m.phone && ` · ${m.phone}`}
                  </p>
                </div>
                <Badge tone={m.status === "RESOLVED" ? "green" : "amber"}>{m.status}</Badge>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{m.message}</p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-400">{new Date(m.createdAt).toLocaleString("en-UG")}</span>
                <AdminContactResolveButton id={m.id} resolved={m.status === "RESOLVED"} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
