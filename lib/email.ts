import { Resend } from "resend";

// Created lazily (not at module load) so importing this file — which Next.js
// does when statically analyzing API routes at build time — doesn't crash
// the build in environments where RESEND_API_KEY isn't set yet.
let cachedClient: Resend | null = null;
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!cachedClient) cachedClient = new Resend(apiKey);
  return cachedClient;
}

/**
 * Best-effort email send: if Resend isn't configured, or the recipient has
 * no email on file, this silently no-ops rather than failing the request
 * that triggered it (a landlord recording a cash payment shouldn't fail
 * just because an email couldn't go out).
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | null | undefined;
  subject: string;
  html: string;
}): Promise<void> {
  if (!to) return;

  const client = getResendClient();
  if (!client) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[email] RESEND_API_KEY not set — skipped "${subject}" to ${to}`);
    }
    return;
  }

  const from = process.env.EMAIL_FROM || "Kezavi <onboarding@resend.dev>";

  try {
    await client.emails.send({ from, to, subject, html });
  } catch (error) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, error);
  }
}

export function emailLayout(title: string, bodyHtml: string, actionUrl?: string, actionLabel?: string): string {
  const appUrl = process.env.NEXTAUTH_URL || "https://realrent-lime.vercel.app";
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <h1 style="font-size: 18px; margin: 0 0 16px;">${title}</h1>
      <div style="font-size: 14px; line-height: 1.6; color: #334155;">${bodyHtml}</div>
      ${
        actionUrl
          ? `<p style="margin-top: 24px;">
              <a href="${appUrl}${actionUrl}" style="display: inline-block; background: #1B4D3A; color: #fff; text-decoration: none; padding: 10px 16px; border-radius: 6px; font-size: 14px;">
                ${actionLabel ?? "View in Kezavi"}
              </a>
            </p>`
          : ""
      }
      <p style="margin-top: 32px; font-size: 12px; color: #94a3b8;">Kezavi</p>
    </div>
  `;
}
