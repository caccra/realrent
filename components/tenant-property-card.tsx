import Image from "next/image";
import { Badge, Card } from "@/components/ui";
import { formatUGX } from "@/lib/money";
import { PROPERTY_TYPES, PROPERTY_USAGES } from "@/lib/validations/property";
import { unitDetailLine } from "@/lib/unit-details";

type TenantLeaseProperty = {
  unit: {
    label: string;
    bedrooms: number;
    bathrooms: number | null;
    otherRooms: string | null;
    rentAmount: unknown;
    billingCycle: string;
    floor: string | null;
    shopNumber: string | null;
    dimensions: string | null;
    property: {
      name: string;
      address: string;
      location: string | null;
      description: string | null;
      usage: string | null;
      propertyType: string | null;
      amenities: string[];
      images: { id: string; url: string }[];
    };
  };
};

export function TenantPropertyCard({ lease }: { lease: TenantLeaseProperty }) {
  const { unit } = lease;
  const { property } = unit;
  const isCommercial = property.usage === "COMMERCIAL";
  const typeLabel = PROPERTY_TYPES.find((t) => t.value === property.propertyType)?.label;
  const usageLabel = PROPERTY_USAGES.find((u) => u.value === property.usage)?.label;

  return (
    <Card className="mb-4 overflow-hidden p-0">
      {property.images.length > 0 && (
        <div className="grid grid-cols-3 gap-1 bg-slate-100 sm:grid-cols-4">
          {property.images.slice(0, 4).map((image, i) => (
            <div
              key={image.id}
              className={`relative aspect-square ${i === 0 ? "col-span-2 row-span-2 sm:col-span-2 sm:row-span-2" : ""}`}
            >
              <Image src={image.url} alt="" fill sizes="25vw" className="object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="p-5">
        <h3 className="text-base font-medium text-slate-900">{property.name}</h3>
        <p className="text-sm text-slate-500">
          {property.address}
          {property.location && ` · ${property.location}`}
        </p>

        {(usageLabel || typeLabel) && (
          <div className="mt-2 flex gap-2">
            {usageLabel && <Badge tone={isCommercial ? "amber" : "green"}>{usageLabel}</Badge>}
            {typeLabel && <Badge>{typeLabel}</Badge>}
          </div>
        )}

        {property.description && <p className="mt-3 text-sm text-slate-600">{property.description}</p>}

        {property.amenities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {property.amenities.map((a) => (
              <Badge key={a}>{a}</Badge>
            ))}
          </div>
        )}

        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-sm font-medium text-slate-900">Your unit</p>
          <p className="mt-1 text-sm text-slate-600">
            {unit.label} · {unit.bedrooms} {isCommercial ? "room" : "bed"} ·{" "}
            {formatUGX(String(unit.rentAmount))} / {unit.billingCycle.toLowerCase()}
          </p>
          {unitDetailLine(unit) && <p className="mt-1 text-sm text-slate-500">{unitDetailLine(unit)}</p>}
        </div>
      </div>
    </Card>
  );
}
