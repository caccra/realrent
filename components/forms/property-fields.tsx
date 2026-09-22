import type { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";
import {
  COMMERCIAL_AMENITIES,
  COMMERCIAL_PROPERTY_TYPES,
  RESIDENTIAL_AMENITIES,
  RESIDENTIAL_PROPERTY_TYPES,
  PROPERTY_USAGES,
  PROPERTY_LISTING_TYPES,
  CURRENCIES,
  type PropertyFormInput,
} from "@/lib/validations/property";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui";

export function PropertyFields({
  register,
  errors,
  setValue,
  isCommercial,
  isSale,
}: {
  register: UseFormRegister<PropertyFormInput>;
  errors: FieldErrors<PropertyFormInput>;
  setValue: UseFormSetValue<PropertyFormInput>;
  isCommercial: boolean;
  isSale: boolean;
}) {
  const typeOptions = isCommercial ? COMMERCIAL_PROPERTY_TYPES : RESIDENTIAL_PROPERTY_TYPES;
  const amenityOptions = isCommercial ? COMMERCIAL_AMENITIES : RESIDENTIAL_AMENITIES;

  return (
    <>
      <div>
        <Label htmlFor="listingType">Listing type</Label>
        <Select id="listingType" {...register("listingType")}>
          {PROPERTY_LISTING_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </div>
      {isSale && (
        <div className="grid grid-cols-1 gap-4 rounded-md border border-slate-200 p-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="salePrice">Sale price</Label>
            <div className="flex gap-2">
              <Input id="salePrice" type="number" min={0} {...register("salePrice")} />
              <Select className="w-24 shrink-0" {...register("saleCurrency")}>
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>
            <FieldError message={errors.salePrice?.message} />
          </div>
          <div>
            <Label htmlFor="saleBedrooms">Bedrooms (optional)</Label>
            <Input id="saleBedrooms" type="number" min={0} max={20} {...register("saleBedrooms")} />
          </div>
          <div>
            <Label htmlFor="saleBathrooms">Bathrooms (optional)</Label>
            <Input id="saleBathrooms" type="number" min={0} max={20} {...register("saleBathrooms")} />
          </div>
        </div>
      )}
      <div>
        <Label htmlFor="usage">Usage</Label>
        <Select
          id="usage"
          {...register("usage", {
            onChange: () => {
              setValue("propertyType", "");
              setValue("amenities", []);
            },
          })}
        >
          <option value="">Not specified</option>
          {PROPERTY_USAGES.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="name">Property name</Label>
        <Input id="name" placeholder="Kisaasi Apartments" {...register("name")} />
        <FieldError message={errors.name?.message} />
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Input id="address" placeholder="Plot 12, Kisaasi Road, Kampala" {...register("address")} />
        <FieldError message={errors.address?.message} />
      </div>
      <div>
        <Label htmlFor="location">Location (area/neighborhood)</Label>
        <Input id="location" placeholder="Kisaasi" {...register("location")} />
        <FieldError message={errors.location?.message} />
      </div>
      <div>
        <Label htmlFor="propertyType">Property type</Label>
        <Select id="propertyType" {...register("propertyType")}>
          <option value="">Not specified</option>
          {typeOptions.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={3}
          placeholder="A short description of the property…"
          {...register("description")}
        />
        <FieldError message={errors.description?.message} />
      </div>
      <div>
        <Label>Amenities</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {amenityOptions.map((amenity) => (
            <label key={amenity} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" value={amenity} {...register("amenities")} />
              {amenity}
            </label>
          ))}
        </div>
      </div>
    </>
  );
}
