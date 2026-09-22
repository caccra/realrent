import { describe, expect, it } from "vitest";
import { generateResetToken, hashToken } from "@/lib/tokens";

describe("generateResetToken", () => {
  it("returns a token and its matching hash", () => {
    const { token, tokenHash } = generateResetToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(tokenHash).toBe(hashToken(token));
  });

  it("generates unique tokens across calls", () => {
    const a = generateResetToken();
    const b = generateResetToken();
    expect(a.token).not.toBe(b.token);
  });
});

describe("hashToken", () => {
  it("is deterministic for the same input", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
  });

  it("produces different hashes for different input", () => {
    expect(hashToken("abc")).not.toBe(hashToken("abcd"));
  });
});
