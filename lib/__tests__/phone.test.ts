import { describe, expect, it } from "vitest";
import { normalizePhone, formatPhoneForDisplay } from "@/lib/phone";

describe("normalizePhone", () => {
  it("normalizes a local 0-prefixed number", () => {
    expect(normalizePhone("0771234567")).toBe("256771234567");
  });

  it("normalizes a number already in 256 form", () => {
    expect(normalizePhone("256771234567")).toBe("256771234567");
  });

  it("normalizes a 9-digit number with no prefix", () => {
    expect(normalizePhone("771234567")).toBe("256771234567");
  });

  it("strips punctuation and spaces before normalizing", () => {
    expect(normalizePhone("+256 771 234 567")).toBe("256771234567");
    expect(normalizePhone("0771-234-567")).toBe("256771234567");
  });

  it("returns null for an invalid length", () => {
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("07712345678900")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(normalizePhone("")).toBeNull();
  });
});

describe("formatPhoneForDisplay", () => {
  it("converts a normalized 256 number back to local 0-prefixed form", () => {
    expect(formatPhoneForDisplay("256771234567")).toBe("0771234567");
  });

  it("returns the input unchanged if it isn't in normalized form", () => {
    expect(formatPhoneForDisplay("0771234567")).toBe("0771234567");
  });
});
