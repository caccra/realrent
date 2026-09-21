import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge, Card } from "@/components/ui";
import { NewUnitForm } from "@/components/forms/new-unit-form";
import { NewLeaseForm } from "@/components/forms/new-lease-form";
import { PropertyActions } from "@/components/forms/property-actions";
import { UnitActions } from "@/components/forms/unit-actions";
import { PropertyPhotos } from "@/components/forms/property-photos";
import { CaretakerSection } from "@/components/forms/caretaker-section";
import { LateFeePolicyForm } from "@/components/forms/late-fee-policy-form";
import { formatUGX } from "@/lib/money";
import { PROPERTY_TYPES, PROPERTY_USAGES } from "@/lib/validations/property";
import { LANDLORD_NAV } from "@/lib/landlord-nav";
import { unitDetailLine } from "@/lib/unit-details";
import { getPropertyReviews } from "@/lib/data";
import { StarRating } from "@/components/star-rating";

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser("LANDLORD");

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      images: { orderBy: [{ featured: "desc" }, { order: "asc" }] },
      caretakerAssignments: { include: { caretaker: true }, orderBy: { createdAt: "asc" } },
      units: {
        orderBy: { label: "asc" },
        include: {
          leases: {
            where: { status: "ACTIVE" },
            include: { tenant: true },
            take: 1,
          },
          _count: { select: { leases: true } },
        },
      },
    },
  });

  if (!property || property.landlordId !== user.id) {
    notFound();
  }

  const typeLabel = PROPERTY_TYPES.find((t) => t.value === property.propertyType)?.label;
  const usageLabel = PROPERTY_USAGES.find((u) => u.value === property.usage)?.label;
  const isCommercial = property.usage === "COMMERCIAL";
  const reviewSummary = await getPropertyReviews(property.id);

  return (
    <DashboardShell title={property.name} userName={user.name ?? ""} nav={LANDLORD_NAV}>
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {property.address}
          {property.location && ` · ${property.location}`}
        </p>
        <span className="text-xs text-slate-400">
          {property.viewCount} view{property.viewCount === 1 ? "" : "s"}
        </span>
      </div>
      {reviewSummary.count > 0 && (
        <div className="mb-2 flex items-center gap-2">
          <StarRating rating={reviewSummary.average} />
          <span className="text-sm text-slate-600">
            {reviewSummary.average.toFixed(1)} ({reviewSummary.count} review
            {reviewSummary.count === 1 ? "" : "s"})
          </span>
        </div>
      )}
      {(usageLabel || typeLabel) && (
        <div className="mb-2 flex gap-2">
          {usageLabel && <Badge tone={property.usage === "COMMERCIAL" ? "amber" : "green"}>{usageLabel}</Badge>}
          {typeLabel && <Badge>{typeLabel}</Badge>}
        </div>
      )}
      {property.description && (
        <p className="mb-2 max-w-2xl text-sm text-slate-600">{property.description}</p>
      )}
      {property.amenities.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {property.amenities.map((amenity) => (
            <Badge key={amenity}>{amenity}</Badge>
          ))}
        </div>
      )}

      <PropertyActions
        property={{
          id: property.id,
          name: property.name,
          address: property.address,
          location: property.location ?? "",
          description: property.description ?? "",
          usage: property.usage ?? "",
          propertyType: property.propertyType ?? "",
          amenities: property.amenities,
        }}
        unitCount={property.units.length}
      />

      <PropertyPhotos propertyId={property.id} images={property.images} />

      <CaretakerSection propertyId={property.id} caretakers={property.caretakerAssignments} />

      <LateFeePolicyForm
        propertyId={property.id}
        defaultValues={{
          lateFeeEnabled: property.lateFeeEnabled,
          lateFeeType: property.lateFeeType ?? "",
          lateFeeValue: property.lateFeeValue != null ? Number(property.lateFeeValue) : undefined,
          lateFeeGraceDays: property.lateFeeGraceDays ?? undefined,
        }}
      />

      <NewUnitForm propertyId={property.id} isCommercial={isCommercial} />

      <div className="mt-6 space-y-4">
        {property.units.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500">No units yet. Add your first unit above.</p>
          </Card>
        ) : (
          property.units.map((unit) => {
            const activeLease = unit.leases[0];
            const detailLine = unitDetailLine(unit);
            return (
              <Card key={unit.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900">
                      {unit.label} · {unit.bedrooms} {isCommercial ? "room" : "bed"}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {formatUGX(unit.rentAmount.toString())} / {unit.billingCycle.toLowerCase()}
                    </p>
                    {detailLine && <p className="mt-1 text-sm text-slate-500">{detailLine}</p>}
                  </div>
                  <Badge tone={unit.status === "OCCUPIED" ? "green" : "slate"}>{unit.status}</Badge>
                </div>

                {activeLease ? (
                  <div className="mt-3 border-t border-slate-100 pt-3 text-sm">
                    <p className="text-slate-600">
                      Tenant: <span className="text-slate-900">{activeLease.tenant.name}</span>
                    </p>
                    <Link
                      href={`/landlord/leases/${activeLease.id}`}
                      className="mt-1 inline-block font-medium text-emerald-700 hover:text-emerald-800"
                    >
                      View lease and invoices →
                    </Link>
                  </div>
                ) : (
                  <NewLeaseForm unitId={unit.id} defaultRentAmount={Number(unit.rentAmount)} />
                )}

                <UnitActions
                  unitId={unit.id}
                  defaultValues={{
                    label: unit.label,
                    bedrooms: unit.bedrooms,
                    bathrooms: unit.bathrooms ?? undefined,
                    otherRooms: unit.otherRooms ?? "",
                    rentAmount: Number(unit.rentAmount),
                    billingCycle: unit.billingCycle,
                    floor: unit.floor ?? "",
                    shopNumber: unit.shopNumber ?? "",
                    dimensions: unit.dimensions ?? "",
                  }}
                  hasLeaseHistory={unit._count.leases > 0}
                  isCommercial={isCommercial}
                />
              </Card>
            );
          })
        )}
      </div>
    </DashboardShell>
  );
}
