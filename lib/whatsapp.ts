/** Builds a wa.me link from a normalized phone number (e.g. "256771234567", no "+"). */
export function whatsappLink(normalizedPhone: string, message?: string): string {
  const base = `https://wa.me/${normalizedPhone}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
