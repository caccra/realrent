import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { getAllPropertiesAdmin } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge, Card } from "@/components/ui";
import { formatPhoneForDisplay } from "@/lib/phone";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { SearchFilterBox } from "@/components/search-filter-box";

export default async function AdminPropertiesPage() {
  const user = await requireAdmin();
  const properties = await getAllPropertiesAdmin();

  return (
    <DashboardShell title="Properties" userName={user.name ?? ""} nav={ADMIN_NAV}>
      <p className="mb-4 text-sm text-slate-500">{properties.length} most recent, across all landlords.</p>
      <SearchFilterBox containerId="admin-properties-body" placeholder="Search by name, address, or landlord…" />
      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Property</th>
              <th className="px-4 py-2 font-medium">Landlord</th>
              <th className="px-4 py-2 font-medium">Listing</th>
              <th className="px-4 py-2 font-medium">Units</th>
              <th className="px-4 py-2 font-medium">Created</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody id="admin-properties-body" className="divide-y divide-slate-100">
            {properties.map((p) => (
              <tr
                key={p.id}
                data-search-text={`${p.name} ${p.address} ${p.landlord.name} ${p.landlord.phone ?? ""}`.toLowerCase()}
              >
                <td className="px-4 py-2 text-slate-900">{p.name}</td>
                <td className="px-4 py-2 text-slate-600">
                  {p.landlord.name}
                  {p.landlord.phone && ` · ${formatPhoneForDisplay(p.landlord.phone)}`}
                </td>
                <td className="px-4 py-2">
                  <Badge tone={p.listingType === "SALE" ? "amber" : "green"}>
                    {p.listingType === "SALE" ? "For sale" : "For rent"}
                  </Badge>
                </td>
                <td className="px-4 py-2 text-slate-600">{p._count.units}</td>
                <td className="px-4 py-2 text-slate-500">{new Date(p.createdAt).toLocaleDateString("en-UG")}</td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/properties/${p.id}`}
                    target="_blank"
                    className="font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    View listing →
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
