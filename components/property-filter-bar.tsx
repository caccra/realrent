import Link from "next/link";
import { Card } from "@/components/ui";

type Option = { value: string; label: string };

export function PropertyFilterBar({
  listingTypes,
  usages,
  propertyTypes,
  defaultValues,
}: {
  listingTypes: readonly Option[];
  usages: readonly Option[];
  propertyTypes: readonly Option[];
  defaultValues: {
    q: string;
    listingType: string;
    usage: string;
    propertyType: string;
    minPrice: string;
    maxPrice: string;
    bedrooms: string;
  };
}) {
  const hasFilters = Object.values(defaultValues).some((v) => v !== "");

  return (
    <Card className="mb-6">
      <form method="GET" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="col-span-2 sm:col-span-3 lg:col-span-2">
          <label htmlFor="q" className="mb-1 block text-xs font-medium text-slate-600">
            Search
          </label>
          <input
            id="q"
            name="q"
            defaultValue={defaultValues.q}
            placeholder="Name, address, area…"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </div>

        <div>
          <label htmlFor="listingType" className="mb-1 block text-xs font-medium text-slate-600">
            Listing type
          </label>
          <select
            id="listingType"
            name="listingType"
            defaultValue={defaultValues.listingType}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="">Any</option>
            {listingTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="usage" className="mb-1 block text-xs font-medium text-slate-600">
            Usage
          </label>
          <select
            id="usage"
            name="usage"
            defaultValue={defaultValues.usage}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="">Any</option>
            {usages.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="propertyType" className="mb-1 block text-xs font-medium text-slate-600">
            Type
          </label>
          <select
            id="propertyType"
            name="propertyType"
            defaultValue={defaultValues.propertyType}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="">Any</option>
            {propertyTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="bedrooms" className="mb-1 block text-xs font-medium text-slate-600">
            Min bedrooms
          </label>
          <input
            id="bedrooms"
            name="bedrooms"
            type="number"
            min={0}
            defaultValue={defaultValues.bedrooms}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </div>

        <div>
          <label htmlFor="minPrice" className="mb-1 block text-xs font-medium text-slate-600">
            Min price (UGX)
          </label>
          <input
            id="minPrice"
            name="minPrice"
            type="number"
            min={0}
            defaultValue={defaultValues.minPrice}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </div>

        <div>
          <label htmlFor="maxPrice" className="mb-1 block text-xs font-medium text-slate-600">
            Max price (UGX)
          </label>
          <input
            id="maxPrice"
            name="maxPrice"
            type="number"
            min={0}
            defaultValue={defaultValues.maxPrice}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </div>

        <div className="col-span-2 flex items-end gap-2 sm:col-span-3 lg:col-span-6">
          <button
            type="submit"
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Apply filters
          </button>
          {hasFilters && (
            <Link
              href="/properties"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Clear
            </Link>
          )}
        </div>
      </form>
    </Card>
  );
}
