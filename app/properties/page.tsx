import Link from "next/link";
import Image from "next/image";
import { getPropertyReviewSummaries, getPublicProperties } from "@/lib/data";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { Badge, Card } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { PROPERTY_TYPES, PROPERTY_USAGES, PROPERTY_LISTING_TYPES } from "@/lib/validations/property";
import { PropertyFilterBar } from "@/components/property-filter-bar";
import { StarRating } from "@/components/star-rating";
import { whatsappLink } from "@/lib/whatsapp";
import { initials } from "@/lib/initials";
import type { PropertyListingType, PropertyType, PropertyUsage } from "@prisma/client";

export const dynamic = "force-dynamic";

const JUST_LISTED_DAYS = 14;

function isJustListed(createdAt: Date): boolean {
  return Date.now() - createdAt.getTime() < JUST_LISTED_DAYS * 24 * 60 * 60 * 1000;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="truncate text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}

function ContactIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-ivy-50 text-ivy-700 hover:bg-ivy-100"
    >
      {children}
    </a>
  );
}

function CallGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.7A2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .3 2 .7 3a2 2 0 01-.4 2.1L8 10.3a16 16 0 006 6l1.5-1.4a2 2 0 012.1-.4c1 .4 2 .6 3 .7a2 2 0 011.7 2z" />
    </svg>
  );
}

function EmailGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
      <path d="M2 6l10 7 10-7" />
    </svg>
  );
}

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.4-.1-.6.1s-.7.9-.9 1.1-.3.2-.6.1c-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.2-.5.1-.2 0-.4 0-.5S9.7 7.6 9.5 7.1c-.2-.5-.3-.4-.5-.4h-.4c-.1 0-.4.1-.6.3s-.9.9-.9 2.1.9 2.5 1 2.6c.1.2 1.8 2.8 4.5 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.5-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l4.9-1.3A10 10 0 1 0 12 2z" />
    </svg>
  );
}

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
    <div className="flex flex-1 flex-col bg-sand">
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
              const usageLabel = PROPERTY_USAGES.find((u) => u.value === property.usage)?.label;
              const typeLabel = PROPERTY_TYPES.find((t) => t.value === property.propertyType)?.label;
              const justListed = isJustListed(new Date(property.createdAt));
              const unitLabel = isSale
                ? null
                : cheapest
                  ? isCommercial && cheapest.shopNumber
                    ? `Shop ${cheapest.shopNumber}`
                    : cheapest.label
                  : null;
              const sizeLabel = isSale
                ? property.saleBedrooms != null
                  ? `${property.saleBedrooms} bed${property.saleBedrooms === 1 ? "" : "s"}`
                  : null
                : cheapest
                  ? `${cheapest.bedrooms} bed${cheapest.bedrooms === 1 ? "" : "s"}`
                  : null;
              const priceLabel = isSale
                ? formatMoney(property.salePrice?.toString() ?? "0", property.saleCurrency)
                : cheapest
                  ? `${formatMoney(cheapest.rentAmount.toString(), cheapest.currency)} / ${cheapest.billingCycle.toLowerCase()}`
                  : null;

              // Prefer the assigned property manager (the day-to-day operational
              // contact) and fall back to the landlord if none is assigned.
              const contact = property.propertyManagerAssignments[0]?.manager ?? property.landlord;
              const contactMessage = `Hi, I'm interested in ${property.name}.`;

              return (
                <Card key={property.id} className="flex h-full flex-col overflow-hidden p-0 hover:border-ivy-300">
                  <Link href={`/properties/${property.id}`}>
                    <div className="relative aspect-video bg-slate-100">
                      {property.images[0] ? (
                        <Image src={property.images[0].url} alt="" fill sizes="33vw" className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-400">
                          No photo
                        </div>
                      )}
                      {justListed && (
                        <span className="absolute left-3 top-3 rounded-full bg-clay px-2.5 py-1 text-[11px] font-semibold text-white shadow">
                          Just listed
                        </span>
                      )}
                      <span className="absolute right-3 top-3">
                        <Badge tone={isSale ? "amber" : "green"}>{isSale ? "For sale" : "For rent"}</Badge>
                      </span>
                    </div>

                    <div className="p-5 pb-4">
                      <h3 className="font-medium text-slate-900">{property.name}</h3>

                      <div className="mt-3 space-y-1.5">
                        <Field label="Location" value={property.location || property.address} />
                        {usageLabel && <Field label="Usage" value={usageLabel} />}
                        {typeLabel && <Field label="Type" value={typeLabel} />}
                        {sizeLabel && <Field label="Size" value={sizeLabel} />}
                        {unitLabel && <Field label={isCommercial ? "Shop no." : "Unit no."} value={unitLabel} />}
                        {priceLabel && <Field label="Price" value={priceLabel} />}
                      </div>
                    </div>
                  </Link>

                  <div className="mt-auto border-t border-slate-100 px-5 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ivy-100 text-[11px] font-semibold text-ivy-800">
                          {initials(contact.name)}
                        </span>
                        <span className="truncate text-xs text-slate-500">{contact.name}</span>
                      </span>
                      {reviewSummary && reviewSummary.count > 0 && (
                        <span className="flex shrink-0 items-center gap-1">
                          <StarRating rating={reviewSummary.average} />
                          <span className="text-xs text-slate-500">{reviewSummary.average.toFixed(1)}</span>
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {contact.phone && (
                        <ContactIcon href={`tel:+${contact.phone}`} label={`Call ${contact.name}`}>
                          <CallGlyph />
                        </ContactIcon>
                      )}
                      {contact.whatsappNumber && (
                        <ContactIcon
                          href={whatsappLink(contact.whatsappNumber, contactMessage)}
                          label={`WhatsApp ${contact.name}`}
                        >
                          <WhatsAppGlyph />
                        </ContactIcon>
                      )}
                      {contact.email && (
                        <ContactIcon href={`mailto:${contact.email}`} label={`Email ${contact.name}`}>
                          <EmailGlyph />
                        </ContactIcon>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
