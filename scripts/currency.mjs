/** Shared currency math: preserve fine API/cache prices, round monthly display separately. */
export const round = (value, digits = 2) => Math.round((value + Number.EPSILON) * 10 ** digits) / 10 ** digits;
export function convertCny(value, currency, rate, digits = 2) {
  if (value == null) return null;
  if (!Number.isFinite(value) || value < 0 || !Number.isFinite(rate) || rate <= 0)
    throw new TypeError("Invalid price or exchange rate");
  if (currency !== "CNY" && currency !== "USD") throw new TypeError("Unsupported currency");
  return round(currency === "CNY" ? value : value * rate, digits);
}
