export type Currency = "UGX" | "USD";

const LOCALE_FOR_CURRENCY: Record<Currency, string> = {
  UGX: "en-UG",
  USD: "en-US",
};

const FRACTION_DIGITS: Record<Currency, number> = {
  UGX: 0,
  USD: 2,
};

export function formatMoney(
  amount: number | string | { toString(): string },
  currency: Currency = "UGX"
): string {
  const value = typeof amount === "number" ? amount : Number(amount.toString());
  return new Intl.NumberFormat(LOCALE_FOR_CURRENCY[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: FRACTION_DIGITS[currency],
    minimumFractionDigits: FRACTION_DIGITS[currency],
  }).format(value);
}

/** @deprecated Prefer formatMoney(amount, currency) so USD amounts render correctly. */
export function formatUGX(amount: number | string | { toString(): string }): string {
  return formatMoney(amount, "UGX");
}
