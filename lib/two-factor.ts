import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";

const TOTP_OPTS = { algorithm: "sha1" as const, digits: 6 as const, period: 30 };

export function generateTwoFactorSecret(accountLabel: string): { secret: string; otpauthUrl: string } {
  const secret = generateSecret();
  const otpauthUrl = generateURI({ issuer: "Kezavi", label: accountLabel, secret, strategy: "totp", ...TOTP_OPTS });
  return { secret, otpauthUrl };
}

export function generateQrCodeDataUrl(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl);
}

export async function verifyTwoFactorToken(secret: string, token: string): Promise<boolean> {
  if (!/^\d{6}$/.test(token)) return false;
  const result = await verify({ secret, token, epochTolerance: 30, strategy: "totp", ...TOTP_OPTS });
  return result.valid;
}
