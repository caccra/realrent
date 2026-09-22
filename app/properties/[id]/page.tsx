import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPropertyReviews, getPublicPropertyDetail, incrementPropertyView } from "@/lib/data";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { Badge, Card } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { PROPERTY_TYPES, PROPERTY_USAGES } from "@/lib/validations/property";
import { PaymentMethodsDisplay } from "@/components/payment-methods-display";
import { StarRating } from "@/components/star-rating";
import { unitDetailLine } from "@/lib/unit-details";
import { PropertyInquiryForm } from "@/components/forms/property-inquiry-form";

export default async function PublicPropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getPublicPropertyDetail(id);

  if (!property) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  let viewCount = property.viewCount;
  if (session?.user?.id !== property.landlordId) {
    const updated = await incrementPropertyView(property.id).catch(() => null);
    if (updated) viewCount = updated.viewCount;
  }

  const reviewSummary = await getPropertyReviews(property.id);

  const typeLabel = PROPERTY_TYPES.find((t) => t.value === property.propertyType)?.label;
  const usageLabel = PROPERTY_USAGES.find((u) => u.value === property.usage)?.label;
  const isCommercial = property.usage === "COMMERCIAL";
  const isSale = property.listingType === "SALE";

  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <PublicHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        <Link href="/properties" className="mb-4 inline-block text-sm text-emerald-700 hover:text-emerald-800">
          ← Back to all properties
        </Link>

        {property.images.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {property.images.map((image, i) => (
              <div
                key={image.id}
                className={`relative overflow-hidden rounded-md bg-slate-100 ${
                  i === 0 ? "col-span-2 row-span-2 aspect-square sm:aspect-auto" : "aspect-square"
                }`}
              >
                <Image src={image.url} alt="" fill sizes="50vw" className="object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">{property.name}</h1>
          <span className="mt-1 shrink-0 text-xs text-slate-400">
            {viewCount} view{viewCount === 1 ? "" : "s"}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {property.address}
          {property.location && ` · ${property.location}`}
        </p>

        {isSale && (
          <p className="mt-2 text-2xl font-semibold text-emerald-700">
            {formatMoney(property.salePrice?.toString() ?? "0", property.saleCurrency)}
            {(property.saleBedrooms != null || property.saleBathrooms != null) && (
              <span className="ml-2 text-base font-normal text-slate-500">
                {property.saleBedrooms != null && `${property.saleBedrooms} bed`}
                {property.saleBedrooms != null && property.saleBathrooms != null && " · "}
                {property.saleBathrooms != null && `${property.saleBathrooms} bath`}
              </span>
            )}
          </p>
        )}

        {reviewSummary.count > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <StarRating rating={reviewSummary.average} />
            <span className="text-sm text-slate-600">
              {reviewSummary.average.toFixed(1)} ({reviewSummary.count} review
              {reviewSummary.count === 1 ? "" : "s"})
            </span>
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <Badge tone={isSale ? "amber" : "green"}>{isSale ? "For sale" : "For rent"}</Badge>
          {usageLabel && (
            <Badge tone={property.usage === "COMMERCIAL" ? "amber" : "green"}>{usageLabel}</Badge>
          )}
          {typeLabel && <Badge>{typeLabel}</Badge>}
        </div>

        {property.description && (
          <p className="mt-4 max-w-2xl text-sm text-slate-600">{property.description}</p>
        )}

        {property.amenities.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {property.amenities.map((amenity) => (
              <Badge key={amenity}>{amenity}</Badge>
            ))}
          </div>
        )}

        {!isSale && (
          <>
            <h2 className="mb-3 mt-8 text-lg font-medium text-slate-900">Available units</h2>
            <div className="space-y-3">
              {property.units.map((unit) => {
                const detailLine = unitDetailLine(unit);
                return (
                  <Card key={unit.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        {unit.label} · {unit.bedrooms} {isCommercial ? "room" : "bed"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatMoney(unit.rentAmount.toString(), unit.currency)} / {unit.billingCycle.toLowerCase()}
                      </p>
                      {detailLine && <p className="mt-1 text-sm text-slate-500">{detailLine}</p>}
                    </div>
                    <Badge tone="green">Vacant</Badge>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {isSale ? (
          <div className="mt-8">
            <PropertyInquiryForm propertyId={property.id} />
          </div>
        ) : (
          <Card className="mt-8 border-emerald-200 bg-emerald-50">
            <p className="text-sm text-emerald-900">
              Listed by <span className="font-medium">{property.landlord.name}</span>. Log in or create a
              free tenant account to get in touch about this property.
            </p>
            <div className="mt-3">
              <PaymentMethodsDisplay landlord={property.landlord} showDetails={false} />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/register?role=TENANT"
                className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
              >
                Sign up as a tenant
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50"
              >
                Log in
              </Link>
            </div>
          </Card>
        )}

        {reviewSummary.recent.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 text-lg font-medium text-slate-900">What tenants say about this property</h2>
            <div className="space-y-3">
              {reviewSummary.recent.map((r) => (
                <Card key={r.id}>
                  <div className="flex items-center justify-between">
                    <StarRating rating={r.rating} />
                    <span className="text-xs text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString("en-UG")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{r.comment}</p>
                  <p className="mt-1 text-xs text-slate-400">{r.author.name}</p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
