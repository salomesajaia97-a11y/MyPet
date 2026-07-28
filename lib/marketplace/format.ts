/**
 * Price label for a listing, or null when the listing has no usable price.
 *
 * `price` is optional on the schema — adoption and lost-found posts have none,
 * mating treats null as "free", and rows created before the create-time check
 * may be missing it entirely. Callers used to format it straight, so a single
 * priceless buy-sell row threw while rendering and took the whole feed down.
 *
 * `spaced` picks the two house styles apart: cards print "1,200₾", the detail
 * page prints "1,200 ₾".
 */
export function formatPrice(
  price: unknown,
  currency?: string | null,
  { spaced = false }: { spaced?: boolean } = {}
): string | null {
  if (typeof price !== "number" || !Number.isFinite(price)) return null;
  const amount = price.toLocaleString();
  return currency === "USD" ? `$${amount}` : `${amount}${spaced ? " " : ""}₾`;
}

/**
 * Age in months → localized label. Under a year reads in months, otherwise in
 * years plus any leftover months (e.g. 26 → "2 yr 2 mo"). Unit words are
 * passed in from the active dictionary (`t.marketplace.units`) so the module
 * stays locale-agnostic.
 */
export function formatAge(
  months: number,
  units: { month: string; year: string }
): string {
  if (!Number.isFinite(months) || months < 0) return "";
  if (months < 12) return `${months} ${units.month}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0
    ? `${years} ${units.year} ${rem} ${units.month}`
    : `${years} ${units.year}`;
}
