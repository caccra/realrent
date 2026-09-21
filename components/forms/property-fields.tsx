import type { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";
import {
  COMMERCIAL_AMENITIES,
  COMMERCIAL_PROPERTY_TYPES,
  RESIDENTIAL_AMENITIES,
  RESIDENTIAL_PROPERTY_TYPES,
  PROPERTY_USAGES,
  type PropertyFormInput,
  type PropertyInput,
} from "@/lib/validations/property";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui";

export function PropertyFields({
  register,
  errors,
  setValue,
  isCommercial,
}: {
  register: UseFormRegister<PropertyFormInput>;
  errors: FieldErrors<PropertyInput>;
  setValue: UseFormSetValue<PropertyFormInput>;
  isCommercial: boolean;
}) {
  const typeOptions = isCommercial ? COMMERCIAL_PROPERTY_TYPES : RESIDENTIAL_PROPERTY_TYPES;
  const amenityOptions = isCommercial ? COMMERCIAL_AMENITIES : RESIDENTIAL_AMENITIES;

  return (
    <>
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
