import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getLandlordTenants } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge, Card } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { formatPhoneForDisplay } from "@/lib/phone";
import { LANDLORD_NAV } from "@/lib/landlord-nav";
import { SearchFilterBox } from "@/components/search-filter-box";
import { invoiceTotalDue } from "@/lib/invoice-total";

export default async function TenantsPage() {
  const user = await requireUser("LANDLORD");
  const leases = await getLandlordTenants(user.id);

  const rows = leases.map((lease) => {
    const balance = lease.invoices.reduce((sum, inv) => {
      const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
      return sum + Math.max(invoiceTotalDue(inv) - paid, 0);
    }, 0);
    return { lease, balance };
  });

  return (
    <DashboardShell title="Tenants" userName={user.name ?? ""} nav={LANDLORD_NAV}>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {rows.length} tenant lease{rows.length === 1 ? "" : "s"} across all your properties.
        </p>
        <Link
          href="/landlord/tenants/assign"
          className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Assign tenant
        </Link>
      </div>

      {rows.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">
            No tenants yet.{" "}
            <Link href="/landlord/tenants/assign" className="font-medium text-emerald-700 hover:text-emerald-800">
              Assign your first tenant
            </Link>{" "}
            to a vacant unit.
          </p>
        </Card>
      ) : (
        <>
          <SearchFilterBox containerId="tenants-table-body" placeholder="Search by tenant name or property…" />
          <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Tenant</th>
                <th className="px-4 py-2 font-medium">Phone</th>
                <th className="px-4 py-2 font-medium">Property / Unit</th>
                <th className="px-4 py-2 font-medium">Lease status</th>
                <th className="px-4 py-2 font-medium">Balance</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody id="tenants-table-body" className="divide-y divide-slate-100">
              {rows.map(({ lease, balance }) => (
                <tr
                  key={lease.id}
                  data-search-text={`${lease.tenant.name} ${lease.unit.property.name} ${lease.unit.label}`.toLowerCase()}
                >
                  <td className="px-4 py-2 text-slate-900">{lease.tenant.name}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {lease.tenant.phone ? formatPhoneForDisplay(lease.tenant.phone) : "—"}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {lease.unit.property.name} — {lease.unit.label}
                  </td>
                  <td className="px-4 py-2">
                    <Badge tone={lease.status === "ACTIVE" ? "green" : "slate"}>{lease.status}</Badge>
                  </td>
                  <td className={`px-4 py-2 ${balance > 0 ? "text-red-700" : "text-slate-600"}`}>
                    {formatMoney(balance, lease.currency)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/landlord/leases/${lease.id}`}
                      className="font-medium text-emerald-700 hover:text-emerald-800"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </Card>
        </>
      )}
    </DashboardShell>
  );
}
