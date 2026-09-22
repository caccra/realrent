import { describe, expect, it } from "vitest";
import { unitDetailLine } from "@/lib/unit-details";

describe("unitDetailLine", () => {
  it("returns null when no fields are set", () => {
    expect(unitDetailLine({})).toBeNull();
  });

  it("joins present fields with a middle dot", () => {
    expect(
      unitDetailLine({
        floor: "2",
        shopNumber: "12B",
        dimensions: "20x30 ft",
        bathrooms: 2,
        otherRooms: "Study",
      })
    ).toBe("Floor: 2 · Shop 12B · 20x30 ft · 2 baths · Study");
  });

  it("uses singular 'bath' for exactly 1 bathroom", () => {
    expect(unitDetailLine({ bathrooms: 1 })).toBe("1 bath");
  });

  it("omits missing fields without leaving stray separators", () => {
    expect(unitDetailLine({ floor: "Ground", bathrooms: 3 })).toBe("Floor: Ground · 3 baths");
  });

  it("treats bathrooms: 0 as present (not missing)", () => {
    expect(unitDetailLine({ bathrooms: 0 })).toBe("0 baths");
  });
});
