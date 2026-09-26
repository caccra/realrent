import { describe, expect, it, vi, beforeEach } from "vitest";
import { sendSms } from "@/lib/sms";

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("sendSms", () => {
  it("no-ops without throwing when there's no recipient", async () => {
    vi.stubEnv("AFRICASTALKING_API_KEY", "test-key");
    vi.stubEnv("AFRICASTALKING_USERNAME", "sandbox");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await sendSms({ to: null, message: "hello" });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("no-ops without throwing when Africa's Talking isn't configured", async () => {
    vi.stubEnv("AFRICASTALKING_API_KEY", "");
    vi.stubEnv("AFRICASTALKING_USERNAME", "");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await sendSms({ to: "256771234567", message: "hello" });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("uses the sandbox host when the username is \"sandbox\"", async () => {
    vi.stubEnv("AFRICASTALKING_API_KEY", "test-key");
    vi.stubEnv("AFRICASTALKING_USERNAME", "sandbox");
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ SMSMessageData: { Recipients: [{ statusCode: 101 }] } }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    await sendSms({ to: "256771234567", message: "hello" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.sandbox.africastalking.com/version1/messaging",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("uses the production host for a live app username", async () => {
    vi.stubEnv("AFRICASTALKING_API_KEY", "test-key");
    vi.stubEnv("AFRICASTALKING_USERNAME", "kezavi-live");
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ SMSMessageData: { Recipients: [{ statusCode: 101 }] } }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    await sendSms({ to: "256771234567", message: "hello" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.africastalking.com/version1/messaging",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("normalizes the recipient to E.164 (adds a leading +) without double-adding it", async () => {
    vi.stubEnv("AFRICASTALKING_API_KEY", "test-key");
    vi.stubEnv("AFRICASTALKING_USERNAME", "sandbox");
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ SMSMessageData: { Recipients: [{ statusCode: 101 }] } }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    await sendSms({ to: "256771234567", message: "hello" });
    const bodyNoPlus = fetchSpy.mock.calls[0][1].body as URLSearchParams;
    expect(bodyNoPlus.get("to")).toBe("+256771234567");

    fetchSpy.mockClear();
    await sendSms({ to: "+256771234567", message: "hello" });
    const bodyWithPlus = fetchSpy.mock.calls[0][1].body as URLSearchParams;
    expect(bodyWithPlus.get("to")).toBe("+256771234567");
  });

  it("does not throw when the send fails", async () => {
    vi.stubEnv("AFRICASTALKING_API_KEY", "test-key");
    vi.stubEnv("AFRICASTALKING_USERNAME", "sandbox");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(sendSms({ to: "256771234567", message: "hello" })).resolves.toBeUndefined();
  });
});
