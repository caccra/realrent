type UnitDetailFields = {
  floor?: string | null;
  shopNumber?: string | null;
  dimensions?: string | null;
  bathrooms?: number | null;
  otherRooms?: string | null;
};

/** A single "Floor: X · Shop Y · 2 baths · Study" style line for a unit's extra details. */
export function unitDetailLine(unit: UnitDetailFields): string | null {
  const parts = [
    unit.floor && `Floor: ${unit.floor}`,
    unit.shopNumber && `Shop ${unit.shopNumber}`,
    unit.dimensions,
    unit.bathrooms != null && `${unit.bathrooms} bath${unit.bathrooms === 1 ? "" : "s"}`,
    unit.otherRooms,
  ].filter(Boolean) as string[];

  return parts.length > 0 ? parts.join(" · ") : null;
}
