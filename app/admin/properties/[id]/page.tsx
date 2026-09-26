import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { getPropertyAdminDetail } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge, Card } from "@/components/ui";
import { formatPhoneForDisplay } from "@/lib/phone";
import { formatMoney } from "@/lib/money";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { AdminEditPropertySection } from "@/components/forms/admin-edit-property-section";
import { AdminPropertyActiveToggle } from "@/components/forms/admin-property-active-toggle";
import { AdminDeletePropertyButton } from "@/components/forms/admin-delete-property-button";

export default async function AdminPropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdmin();
  const isSuperAdmin = admin.role === "SUPER_ADMIN";

  const property = await getPropertyAdminDetail(id);
  if (!property) {
    notFound();
  }

  return (
    <DashboardShell title={property.name} userName={admin.name ?? ""} nav={ADMIN_NAV}>
      <Link href="/admin/properties" className="mb-4 inline-block text-sm text-ivy-700 hover:text-ivy-800">
        ← All properties
      </Link>

      <Card className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">
              {property.address}
              {property.location && ` · ${property.location}`}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Landlord:{" "}
              <Link href={`/admin/users/${property.landlord.id}`} className="font-medium text-ivy-700 hover:text-ivy-800">
                {property.landlord.name}
              </Link>
              {property.landlord.phone && ` · ${formatPhoneForDisplay(property.landlord.phone)}`}
            </p>
            <div className="mt-2 flex gap-2">
              <Badge tone={property.listingType === "SALE" ? "amber" : "green"}>
                {property.listingType === "SALE" ? "For sale" : "For rent"}
              </Badge>
              {property.listingType === "SALE" && property.salePrice != null && (
                <Badge>{formatMoney(property.salePrice.toString(), property.saleCurrency)}</Badge>
              )}
            </div>
          </div>
          {isSuperAdmin && (
            <AdminPropertyActiveToggle propertyId={property.id} active={property.active} />
          )}
        </div>
        {!property.active && property.deactivatedReason && (
          <p className="mt-3 text-sm text-amber-700">Reason: {property.deactivatedReason}</p>
        )}
      </Card>

      {isSuperAdmin && (
        <>
          <AdminEditPropertySection
            propertyId={property.id}
            defaultValues={{
              name: property.name,
              address: property.address,
              location: property.location ?? "",
              description: property.description ?? "",
              usage: property.usage ?? "",
              propertyType: property.propertyType ?? "",
              amenities: property.amenities,
              listingType: property.listingType,
              salePrice: property.salePrice != null ? Number(property.salePrice) : undefined,
              saleCurrency: property.saleCurrency,
              saleBedrooms: property.saleBedrooms ?? undefined,
              saleBathrooms: property.saleBathrooms ?? undefined,
            }}
          />
        </>
      )}

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-medium text-slate-900">Units ({property.units.length})</h2>
        {property.units.length === 0 ? (
          <p className="text-sm text-slate-500">No units on this property yet.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {property.units.map((u) => (
              <li key={u.id} className="flex items-center justify-between">
                <span className="text-slate-700">{u.label}</span>
                <Badge tone={u.status === "OCCUPIED" ? "green" : "slate"}>{u.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {isSuperAdmin && (
        <AdminDeletePropertyButton propertyId={property.id} unitCount={property._count.units} />
      )}
    </DashboardShell>
  );
}
