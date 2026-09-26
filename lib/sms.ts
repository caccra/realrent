const AT_PRODUCTION_HOST = "https://api.africastalking.com";
const AT_SANDBOX_HOST = "https://api.sandbox.africastalking.com";

// Africa's Talking requires the sandbox *host* (not just the "sandbox"
// username) for test apps — mixing a sandbox username with the production
// host is a common integration mistake, so this is derived automatically
// rather than left for a caller to get wrong.
function getConfig(): { apiKey: string; username: string; host: string } | null {
  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME;
  if (!apiKey || !username) return null;
  const host = username === "sandbox" ? AT_SANDBOX_HOST : AT_PRODUCTION_HOST;
  return { apiKey, username, host };
}

/**
 * Best-effort SMS send: if Africa's Talking isn't configured, or the
 * recipient has no phone on file, this silently no-ops rather than failing
 * the request that triggered it — same fail-safe pattern as lib/email.ts.
 * `to` should be a normalized phone number (e.g. "2567XXXXXXXX", with or
 * without a leading "+").
 */
export async function sendSms({
  to,
  message,
}: {
  to: string | null | undefined;
  message: string;
}): Promise<void> {
  if (!to) return;

  const config = getConfig();
  if (!config) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[sms] AFRICASTALKING_API_KEY not set — skipped "${message}" to ${to}`);
    }
    return;
  }

  const recipient = to.startsWith("+") ? to : `+${to}`;

  try {
    const response = await fetch(`${config.host}/version1/messaging`, {
      method: "POST",
      headers: {
        apiKey: config.apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({ username: config.username, to: recipient, message }),
    });

    const body = await response.json().catch(() => null);
    const recipientStatus = body?.SMSMessageData?.Recipients?.[0];
    // 101 = "Success" in Africa's Talking's per-recipient status codes.
    if (!response.ok || (recipientStatus && recipientStatus.statusCode !== 101)) {
      console.error(`[sms] Send to ${recipient} did not succeed:`, body ?? response.statusText);
    }
  } catch (error) {
    console.error(`[sms] Failed to send to ${recipient}:`, error);
  }
}
