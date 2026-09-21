/**
 * Normalizes Uganda phone numbers to a consistent "2567XXXXXXXX" form
 * so the same person entering "0771234567" or "+256771234567" resolves
 * to one account.
 */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");

  if (digits.startsWith("256") && digits.length === 12) {
    return digits;
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return "256" + digits.slice(1);
  }
  if (digits.length === 9) {
    return "256" + digits;
  }
  return null;
}

export function formatPhoneForDisplay(normalized: string): string {
  if (normalized.startsWith("256") && normalized.length === 12) {
    return "0" + normalized.slice(3);
  }
  return normalized;
}
