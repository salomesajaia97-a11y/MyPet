import { cityByName, cityFromCoords, type City } from "@/lib/services/locality";

/**
 * Group directory entries by the town they are in, so each (category, city)
 * pair can have its own landing page.
 *
 * "ვეტკლინიკა თბილისში" is a different query from "ვეტკლინიკა", and a single
 * nationwide category page competes for neither of them well. What ranks is a
 * page that says the town in its title, its heading and its content, and lists
 * only the businesses actually there.
 *
 * The grouping resolves a town per row the same way the detail page does — the
 * stored `city` first, then the coordinates — which is what makes these pages
 * possible before the directory has been enriched: two thirds of the rows have
 * no stored city, but three quarters have coordinates.
 */

export interface CityGroupable {
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
}

/**
 * Fewest entries a landing page is allowed to have.
 *
 * A page listing one business is thinner than the business's own page and adds
 * nothing but a near-duplicate — which is what Google means by a doorway page.
 * Three is the point where a page is a genuinely useful shortlist.
 */
export const MIN_PER_CITY_PAGE = 3;

/** The city a row belongs to, or null when it cannot be placed. */
export function cityOf(row: CityGroupable): City | null {
  return cityByName(row.city) ?? cityFromCoords(row.lat, row.lng);
}

/**
 * Group rows by city slug, keeping only the groups big enough to deserve a page.
 * Returned largest group first, which is also the order they are worth linking
 * in.
 */
export function groupByCity<T extends CityGroupable>(
  rows: T[],
  minPerGroup: number = MIN_PER_CITY_PAGE
): { city: City; rows: T[] }[] {
  const groups = new Map<string, { city: City; rows: T[] }>();
  for (const row of rows) {
    const city = cityOf(row);
    if (!city) continue;
    const group = groups.get(city.slug);
    if (group) group.rows.push(row);
    else groups.set(city.slug, { city, rows: [row] });
  }
  return [...groups.values()]
    .filter((g) => g.rows.length >= minPerGroup)
    .sort((a, b) => b.rows.length - a.rows.length);
}

/** Rows in one city, whether or not that city is big enough for its own page. */
export function rowsInCity<T extends CityGroupable>(rows: T[], city: City): T[] {
  return rows.filter((row) => cityOf(row)?.slug === city.slug);
}
