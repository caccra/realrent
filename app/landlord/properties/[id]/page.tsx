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
import { PropertyManagerSection } from "@/components/forms/property-manager-section";
import { LateFeePolicyForm } from "@/components/forms/late-fee-policy-form";
import { formatMoney } from "@/lib/money";
import { PROPERTY_TYPES, PROPERTY_USAGES } from "@/lib/validations/property";
import { navForRole } from "@/lib/landlord-nav";
import { unitDetailLine } from "@/lib/unit-details";
import { getPropertyInquiries, getPropertyReviews } from "@/lib/data";
import { canManageProperty } from "@/lib/authorization";
import { StarRating } from "@/components/star-rating";

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(["LANDLORD", "PROPERTY_MANAGER"]);
  const isLandlord = user.role === "LANDLORD";

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      images: { orderBy: [{ featured: "desc" }, { order: "asc" }] },
      caretakerAssignments: { include: { caretaker: true }, orderBy: { createdAt: "asc" } },
      propertyManagerAssignments: { include: { manager: true }, orderBy: { createdAt: "asc" } },
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

  if (!property || !(await canManageProperty(user.id, user.role, property.id))) {
    notFound();
  }

  const typeLabel = PROPERTY_TYPES.find((t) => t.value === property.propertyType)?.label;
  const usageLabel = PROPERTY_USAGES.find((u) => u.value === property.usage)?.label;
  const isCommercial = property.usage === "COMMERCIAL";
  const isSale = property.listingType === "SALE";
  const reviewSummary = await getPropertyReviews(property.id);
  const inquiries = isSale ? await getPropertyInquiries(property.id) : [];

  return (
    <DashboardShell title={property.name} userName={user.name ?? ""} nav={navForRole(user.role)}>
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
      <div className="mb-2 flex gap-2">
        <Badge tone={isSale ? "amber" : "green"}>{isSale ? "For sale" : "For rent"}</Badge>
        {usageLabel && <Badge tone={property.usage === "COMMERCIAL" ? "amber" : "green"}>{usageLabel}</Badge>}
        {typeLabel && <Badge>{typeLabel}</Badge>}
      </div>
      {isSale && (
        <p className="mb-2 text-lg font-semibold text-slate-900">
          {formatMoney(property.salePrice?.toString() ?? "0", property.saleCurrency)}
          {(property.saleBedrooms != null || property.saleBathrooms != null) && (
            <span className="ml-2 text-sm font-normal text-slate-500">
              {property.saleBedrooms != null && `${property.saleBedrooms} bed`}
              {property.saleBedrooms != null && property.saleBathrooms != null && " · "}
              {property.saleBathrooms != null && `${property.saleBathrooms} bath`}
            </span>
          )}
        </p>
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

      {!isSale && (
        <Link
          href={`/landlord/properties/${property.id}/statement`}
          className="mb-4 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          View monthly statement →
        </Link>
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
          listingType: property.listingType,
          salePrice: property.salePrice != null ? Number(property.salePrice) : undefined,
          saleCurrency: property.saleCurrency,
          saleBedrooms: property.saleBedrooms ?? undefined,
          saleBathrooms: property.saleBathrooms ?? undefined,
        }}
        unitCount={property.units.length}
        canDelete={isLandlord}
      />

      <PropertyPhotos propertyId={property.id} images={property.images} />

      {isLandlord && (
        <>
          <CaretakerSection propertyId={property.id} caretakers={property.caretakerAssignments} />
          <PropertyManagerSection propertyId={property.id} managers={property.propertyManagerAssignments} />
        </>
      )}

      {isSale && (
        <Card className="mb-6">
          <p className="mb-3 text-sm font-medium text-slate-900">
            Inquiries ({inquiries.length})
          </p>
          {inquiries.length === 0 ? (
            <p className="text-sm text-slate-500">No inquiries yet.</p>
          ) : (
            <ul className="space-y-3">
              {inquiries.map((inq) => (
                <li key={inq.id} className="border-t border-slate-100 pt-3 text-sm first:border-0 first:pt-0">
                  <p className="font-medium text-slate-900">
                    {inq.name} · {inq.phone}
                    {inq.email && ` · ${inq.email}`}
                  </p>
                  <p className="text-slate-600">{inq.message}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(inq.createdAt).toLocaleString("en-UG")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {!isSale && (
        <LateFeePolicyForm
          propertyId={property.id}
          defaultValues={{
            lateFeeEnabled: property.lateFeeEnabled,
            lateFeeType: property.lateFeeType ?? "",
            lateFeeValue: property.lateFeeValue != null ? Number(property.lateFeeValue) : undefined,
            lateFeeGraceDays: property.lateFeeGraceDays ?? undefined,
          }}
        />
      )}

      {!isSale && <NewUnitForm propertyId={property.id} isCommercial={isCommercial} />}

      {!isSale && (
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
                      {formatMoney(unit.rentAmount.toString(), unit.currency)} / {unit.billingCycle.toLowerCase()}
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
                    currency: unit.currency,
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
      )}
    </DashboardShell>
  );
}
