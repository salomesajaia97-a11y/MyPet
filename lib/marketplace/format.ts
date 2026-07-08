/**
 * Age in months → localized label. Under a year reads in months, otherwise in
 * years plus any leftover months (e.g. 26 → "2 წელი 2 თვე"). Unit words are
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
