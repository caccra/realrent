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
import { WhatsAppLink } from "@/components/whatsapp-link";
import { initials } from "@/lib/initials";

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

  const contactCard = isSale ? (
    <Card>
      <p className="text-2xl font-semibold text-ivy-700">
        {formatMoney(property.salePrice?.toString() ?? "0", property.saleCurrency)}
      </p>
      {(property.saleBedrooms != null || property.saleBathrooms != null) && (
        <p className="mt-1 text-sm text-slate-500">
          {property.saleBedrooms != null && `${property.saleBedrooms} bed`}
          {property.saleBedrooms != null && property.saleBathrooms != null && " · "}
          {property.saleBathrooms != null && `${property.saleBathrooms} bath`}
        </p>
      )}
      <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ivy-100 text-xs font-semibold text-ivy-800">
          {initials(property.landlord.name)}
        </span>
        <span className="min-w-0">
          <span className="block text-xs text-slate-500">Listed by</span>
          <span className="block truncate text-sm font-medium text-slate-900">{property.landlord.name}</span>
        </span>
        {property.landlord.whatsappNumber && (
          <WhatsAppLink
            number={property.landlord.whatsappNumber}
            message={`Hi, I'm interested in ${property.name}.`}
            className="ml-auto shrink-0 text-sm font-medium text-ivy-700 hover:text-ivy-800"
          />
        )}
      </div>
      <div className="mt-4 border-t border-slate-100 pt-4">
        <PropertyInquiryForm propertyId={property.id} />
      </div>
    </Card>
  ) : (
    <Card className="border-ivy-200 bg-ivy-50">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-ivy-800">
          {initials(property.landlord.name)}
        </span>
        <span className="min-w-0">
          <span className="block text-xs text-ivy-700">Listed by</span>
          <span className="block truncate text-sm font-medium text-ivy-900">{property.landlord.name}</span>
        </span>
        {property.landlord.whatsappNumber && (
          <WhatsAppLink
            number={property.landlord.whatsappNumber}
            message={`Hi, I'm interested in ${property.name}.`}
            className="ml-auto shrink-0 text-sm font-medium text-ivy-800 hover:text-ivy-900"
          />
        )}
      </div>
      <p className="mt-3 text-sm text-ivy-800">Log in or create a free tenant account to get in touch.</p>
      <div className="mt-4 border-t border-ivy-200 pt-4">
        <PaymentMethodsDisplay landlord={property.landlord} showDetails={false} />
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/register?role=TENANT"
          className="rounded-md bg-ivy-700 px-4 py-2 text-sm font-medium text-white hover:bg-ivy-800"
        >
          Sign up as a tenant
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-ivy-300 bg-white px-4 py-2 text-sm font-medium text-ivy-800 hover:bg-ivy-50"
        >
          Log in
        </Link>
      </div>
    </Card>
  );

  return (
    <div className="flex flex-1 flex-col bg-sand">
      <PublicHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <Link href="/properties" className="mb-4 inline-block text-sm text-ivy-700 hover:text-ivy-800">
          ← Back to all properties
        </Link>

        {property.images.length === 1 ? (
          <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-xl bg-slate-100">
            <Image src={property.images[0].url} alt="" fill sizes="100vw" priority className="object-cover" />
          </div>
        ) : (
          property.images.length > 1 && (
            <div className="mb-6 grid grid-cols-2 gap-2 sm:auto-rows-[160px] sm:grid-cols-4">
              {property.images.map((image, i) => (
                <div
                  key={image.id}
                  className={`relative overflow-hidden rounded-lg bg-slate-100 ${
                    i === 0 ? "col-span-2 row-span-2 aspect-[4/3] sm:aspect-auto" : "aspect-square"
                  }`}
                >
                  <Image src={image.url} alt="" fill sizes="50vw" className="object-cover" />
                </div>
              ))}
            </div>
          )
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <div className="flex items-start justify-between gap-3">
                <h1 className="font-heading text-2xl font-bold text-slate-900">{property.name}</h1>
                <span className="mt-1 flex shrink-0 items-center gap-1 text-xs text-slate-400">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  {viewCount} view{viewCount === 1 ? "" : "s"}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {property.address}
                {property.location && ` · ${property.location}`}
              </p>

              {reviewSummary.count > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <StarRating rating={reviewSummary.average} />
                  <span className="text-sm text-slate-600">
                    {reviewSummary.average.toFixed(1)} ({reviewSummary.count} review
                    {reviewSummary.count === 1 ? "" : "s"})
                  </span>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone={isSale ? "amber" : "green"}>{isSale ? "For sale" : "For rent"}</Badge>
                {usageLabel && (
                  <Badge tone={property.usage === "COMMERCIAL" ? "amber" : "green"}>{usageLabel}</Badge>
                )}
                {typeLabel && <Badge>{typeLabel}</Badge>}
              </div>

              {property.description && (
                <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-600">
                  {property.description}
                </p>
              )}

              {property.amenities.length > 0 && (
                <div className={`flex flex-wrap gap-2 ${property.description ? "mt-4" : "mt-4 border-t border-slate-100 pt-4"}`}>
                  {property.amenities.map((amenity) => (
                    <Badge key={amenity}>{amenity}</Badge>
                  ))}
                </div>
              )}
            </Card>

            {!isSale && property.units.length > 0 && (
              <Card>
                <h2 className="font-heading text-lg font-bold text-slate-900">Available units</h2>
                <div className="mt-3 divide-y divide-slate-100">
                  {property.units.map((unit) => {
                    const detailLine = unitDetailLine(unit);
                    return (
                      <div key={unit.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                        <div>
                          <p className="font-medium text-slate-900">
                            {unit.label} · {unit.bedrooms} {isCommercial ? "room" : "bed"}
                          </p>
                          <p className="text-sm text-slate-500">
                            {formatMoney(unit.rentAmount.toString(), unit.currency)} / {unit.billingCycle.toLowerCase()}
                            {detailLine && ` · ${detailLine}`}
                          </p>
                        </div>
                        <Badge tone="green">Vacant</Badge>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {reviewSummary.recent.length > 0 && (
              <Card>
                <h2 className="font-heading text-lg font-bold text-slate-900">What tenants say about this property</h2>
                <div className="mt-3 divide-y divide-slate-100">
                  {reviewSummary.recent.map((r) => (
                    <div key={r.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <StarRating rating={r.rating} />
                        <span className="text-xs text-slate-400">
                          {new Date(r.createdAt).toLocaleDateString("en-UG")}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{r.comment}</p>
                      <p className="mt-1 text-xs text-slate-400">{r.author.name}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6">{contactCard}</div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
