import { describe, expect, it } from "vitest";
import { whatsappNumberSchema } from "@/lib/validations/whatsapp";

describe("whatsappNumberSchema", () => {
  it("accepts a local 0-prefixed number", () => {
    expect(whatsappNumberSchema.safeParse({ whatsappNumber: "0771234567" }).success).toBe(true);
  });

  it("accepts a number already carrying the 256 country code", () => {
    expect(whatsappNumberSchema.safeParse({ whatsappNumber: "+256 771 234 567" }).success).toBe(true);
  });

  it("accepts a blank value (hides the link)", () => {
    expect(whatsappNumberSchema.safeParse({ whatsappNumber: "" }).success).toBe(true);
    expect(whatsappNumberSchema.safeParse({}).success).toBe(true);
  });

  it("rejects a 0-prefixed number of the wrong length, even though it's long enough to pass a bare min-length check", () => {
    const result = whatsappNumberSchema.safeParse({ whatsappNumber: "07712345678" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/country code/i);
    }
  });

  it("rejects an obviously too-short number", () => {
    expect(whatsappNumberSchema.safeParse({ whatsappNumber: "12345" }).success).toBe(false);
  });
});
