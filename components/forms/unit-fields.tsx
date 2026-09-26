import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { CURRENCIES, type UnitFormInput } from "@/lib/validations/property";
import { FieldError, Input, Label, Select } from "@/components/ui";

export function UnitFields({
  register,
  errors,
  isCommercial,
}: {
  register: UseFormRegister<UnitFormInput>;
  errors: FieldErrors<UnitFormInput>;
  isCommercial?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="label">Unit label</Label>
        <Input id="label" placeholder="A1" {...register("label")} />
        <FieldError message={errors.label?.message} />
      </div>
      <div>
        <Label htmlFor="bedrooms">{isCommercial ? "Rooms" : "Bedrooms"}</Label>
        <Input id="bedrooms" type="number" min={0} {...register("bedrooms")} />
        <FieldError message={errors.bedrooms?.message} />
      </div>
      <div>
        <Label htmlFor="rentAmount">Rent amount</Label>
        <div className="flex gap-2">
          <Input id="rentAmount" type="number" min={0} {...register("rentAmount")} />
          <Select className="w-24 shrink-0" {...register("currency")}>
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <FieldError message={errors.rentAmount?.message} />
      </div>
      <div>
        <Label htmlFor="billingCycle">Billing cycle</Label>
        <Select id="billingCycle" {...register("billingCycle")}>
          <option value="MONTHLY">Monthly</option>
          <option value="QUARTERLY">Quarterly</option>
          <option value="ANNUAL">Annual</option>
        </Select>
      </div>

      {!isCommercial && (
        <>
          <div>
            <Label htmlFor="bathrooms">Bathrooms (optional)</Label>
            <Input id="bathrooms" type="number" min={0} {...register("bathrooms")} />
            <FieldError message={errors.bathrooms?.message} />
          </div>
          <div>
            <Label htmlFor="otherRooms">Other rooms (optional)</Label>
            <Input id="otherRooms" placeholder="Study, Store" {...register("otherRooms")} />
            <FieldError message={errors.otherRooms?.message} />
          </div>
        </>
      )}

      {isCommercial && (
        <>
          <div>
            <Label htmlFor="floor">Level / Floor</Label>
            <Input id="floor" placeholder="Ground floor" {...register("floor")} />
            <FieldError message={errors.floor?.message} />
          </div>
          <div>
            <Label htmlFor="shopNumber">Shop / Suite Number</Label>
            <Input id="shopNumber" placeholder="G-14" {...register("shopNumber")} />
            <FieldError message={errors.shopNumber?.message} />
          </div>
          <div>
            <Label htmlFor="dimensions">Dimensions (optional)</Label>
            <Input id="dimensions" placeholder="20ft x 30ft" {...register("dimensions")} />
            <FieldError message={errors.dimensions?.message} />
          </div>
        </>
      )}
    </div>
  );
}
