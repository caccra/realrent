import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/lib/session";
import { getLandlordProperties } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge, Card } from "@/components/ui";
import { PROPERTY_USAGES } from "@/lib/validations/property";
import { LANDLORD_NAV } from "@/lib/landlord-nav";
import { SearchFilterBox } from "@/components/search-filter-box";
import { formatUGX } from "@/lib/money";

export default async function PropertiesPage() {
  const user = await requireUser("LANDLORD");
  const properties = await getLandlordProperties(user.id);

  return (
    <DashboardShell title="Properties" userName={user.name ?? ""} nav={LANDLORD_NAV}>
      <Link
        href="/landlord/properties/new"
        className="mb-6 inline-flex items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
      >
        Add property
      </Link>

      {properties.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">
            No properties yet. Add your first property to start creating units and leases.
          </p>
        </Card>
      ) : (
        <>
          <SearchFilterBox containerId="properties-grid" placeholder="Search by name or address…" />
          <div id="properties-grid" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {properties.map((property) => {
            const isSale = property.listingType === "SALE";
            const occupied = property.units.filter((u) => u.status === "OCCUPIED").length;
            return (
              <Link
                key={property.id}
                href={`/landlord/properties/${property.id}`}
                data-search-text={`${property.name} ${property.address}`.toLowerCase()}
              >
                <Card className="h-full overflow-hidden p-0 hover:border-emerald-300">
                  <div className="relative aspect-video bg-slate-100">
                    {property.images[0] ? (
                      <Image
                        src={property.images[0].url}
                        alt=""
                        fill
                        sizes="50vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        No photo
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-slate-900">{property.name}</h3>
                      <div className="flex shrink-0 gap-1">
                        <Badge tone={isSale ? "amber" : "green"}>{isSale ? "For sale" : "For rent"}</Badge>
                        {property.usage && (
                          <Badge tone={property.usage === "COMMERCIAL" ? "amber" : "green"}>
                            {PROPERTY_USAGES.find((u) => u.value === property.usage)?.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{property.address}</p>
                    {isSale ? (
                      <p className="mt-3 text-sm text-slate-600">
                        {formatUGX(property.salePrice?.toString() ?? "0")}
                      </p>
                    ) : (
                      <p className="mt-3 text-sm text-slate-600">
                        {property.units.length} unit{property.units.length === 1 ? "" : "s"} — {occupied} occupied
                      </p>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
