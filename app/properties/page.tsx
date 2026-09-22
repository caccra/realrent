import Link from "next/link";
import Image from "next/image";
import { getPropertyReviewSummaries, getPublicProperties } from "@/lib/data";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { Badge, Card } from "@/components/ui";
import { formatUGX } from "@/lib/money";
import { PROPERTY_TYPES, PROPERTY_USAGES, PROPERTY_LISTING_TYPES } from "@/lib/validations/property";
import { PropertyFilterBar } from "@/components/property-filter-bar";
import { StarRating } from "@/components/star-rating";
import type { PropertyListingType, PropertyType, PropertyUsage } from "@prisma/client";

export const dynamic = "force-dynamic";

function toInt(value: string | string[] | undefined): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function toStr(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.length > 0 ? raw : undefined;
}

export default async function PublicPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filters = {
    q: toStr(params.q),
    listingType: toStr(params.listingType) as PropertyListingType | undefined,
    usage: toStr(params.usage) as PropertyUsage | undefined,
    propertyType: toStr(params.propertyType) as PropertyType | undefined,
    minPrice: toInt(params.minPrice),
    maxPrice: toInt(params.maxPrice),
    bedrooms: toInt(params.bedrooms),
  };
  const properties = await getPublicProperties(filters);
  const reviewSummaries = await getPropertyReviewSummaries(properties.map((p) => p.id));
  const hasFilters = Object.values(filters).some((v) => v !== undefined);

  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <PublicHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Available properties</h1>
        <p className="mb-6 text-sm text-slate-500">
          {properties.length} propert{properties.length === 1 ? "y" : "ies"}
          {hasFilters && " matching your filters"}
        </p>

        <PropertyFilterBar
          listingTypes={PROPERTY_LISTING_TYPES}
          usages={PROPERTY_USAGES}
          propertyTypes={PROPERTY_TYPES}
          defaultValues={{
            q: filters.q ?? "",
            listingType: filters.listingType ?? "",
            usage: filters.usage ?? "",
            propertyType: filters.propertyType ?? "",
            minPrice: params.minPrice ? String(params.minPrice) : "",
            maxPrice: params.maxPrice ? String(params.maxPrice) : "",
            bedrooms: params.bedrooms ? String(params.bedrooms) : "",
          }}
        />

        {properties.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500">
              {hasFilters
                ? "No properties match your filters. Try broadening your search."
                : "No properties listed right now. Check back soon."}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => {
              const isSale = property.listingType === "SALE";
              const cheapest = property.units[0];
              const isCommercial = property.usage === "COMMERCIAL";
              const reviewSummary = reviewSummaries.get(property.id);
              const unitLine =
                !isSale && cheapest
                  ? isCommercial
                    ? [cheapest.shopNumber && `Shop ${cheapest.shopNumber}`, cheapest.floor && `Floor: ${cheapest.floor}`]
                        .filter(Boolean)
                        .join(" · ")
                    : `${cheapest.bedrooms} bed${cheapest.bedrooms === 1 ? "" : "s"}${
                        cheapest.bathrooms != null
                          ? ` · ${cheapest.bathrooms} bath${cheapest.bathrooms === 1 ? "" : "s"}`
                          : ""
                      }`
                  : null;
              return (
                <Link key={property.id} href={`/properties/${property.id}`}>
                  <Card className="h-full overflow-hidden p-0 hover:border-emerald-300">
                    <div className="relative aspect-video bg-slate-100">
                      {property.images[0] ? (
                        <Image
                          src={property.images[0].url}
                          alt=""
                          fill
                          sizes="33vw"
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
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {property.location || property.address}
                      </p>
                      {reviewSummary && reviewSummary.count > 0 && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <StarRating rating={reviewSummary.average} />
                          <span className="text-xs text-slate-500">
                            {reviewSummary.average.toFixed(1)} ({reviewSummary.count})
                          </span>
                        </div>
                      )}
                      {isSale ? (
                        <>
                          <p className="mt-3 text-sm font-medium text-emerald-700">
                            {formatUGX(property.salePrice?.toString() ?? "0")}
                          </p>
                          {(property.saleBedrooms != null || property.saleBathrooms != null) && (
                            <p className="mt-1 text-sm text-slate-500">
                              {property.saleBedrooms != null && `${property.saleBedrooms} bed`}
                              {property.saleBedrooms != null && property.saleBathrooms != null && " · "}
                              {property.saleBathrooms != null && `${property.saleBathrooms} bath`}
                            </p>
                          )}
                        </>
                      ) : (
                        cheapest && (
                          <>
                            <p className="mt-3 text-sm font-medium text-emerald-700">
                              From {formatUGX(cheapest.rentAmount.toString())} /{" "}
                              {cheapest.billingCycle.toLowerCase()}
                            </p>
                            {unitLine && <p className="mt-1 text-sm text-slate-500">{unitLine}</p>}
                            <p className="mt-1 text-sm text-slate-500">
                              {property.units.length} unit{property.units.length === 1 ? "" : "s"} available
                            </p>
                          </>
                        )
                      )}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
