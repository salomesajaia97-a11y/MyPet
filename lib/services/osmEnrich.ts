import { safeExternalUrl } from "@/lib/url";
import { cityFromCoords } from "@/lib/services/locality";

/**
 * Re-read the OpenStreetMap objects the services directory was imported from,
 * and fill in the fields the original import dropped.
 *
 * The import kept name, coordinates and a one-line description, and threw away
 * everything else — 45 of 91 live entries have no street address and 36 no
 * phone, even though OSM holds both. Re-querying is possible because each row
 * stored its origin in `placeId` ("osm:node/11231075837"), so this is a lookup
 * by id rather than a fuzzy re-match, and the answer is authoritative.
 *
 * Everything here is pure: build a query, parse a response, decide what to
 * write. The route that talks to the network and the database is thin on top,
 * so the mapping rules — which are the part that can quietly corrupt 133 live
 * pages — are unit-testable without either.
 *
 * OSM data is ODbL: attribution is required, which the admin UI states and
 * `source: "osm"` on the row records.
 */

export interface OsmRef {
  type: "node" | "way" | "relation";
  id: number;
}

/** Parse a stored `placeId`. Returns null for the hand-seeded rows ("seed:vc1"). */
export function parseOsmId(placeId?: string | null): OsmRef | null {
  const m = /^osm:(node|way|relation)\/(\d+)$/.exec(placeId?.trim() ?? "");
  if (!m) return null;
  return { type: m[1] as OsmRef["type"], id: Number(m[2]) };
}

/**
 * One Overpass QL query for a whole batch.
 *
 * Grouped by object type because Overpass takes ids per type, and `center` is
 * requested so a way (4 of the rows are ways, e.g. a building outline) still
 * yields a coordinate.
 */
export function buildOverpassQuery(refs: OsmRef[], timeoutSeconds = 60): string {
  const byType = new Map<OsmRef["type"], number[]>();
  for (const ref of refs) {
    const list = byType.get(ref.type) ?? [];
    list.push(ref.id);
    byType.set(ref.type, list);
  }
  const parts = [...byType.entries()].map(
    ([type, ids]) => `${type}(id:${[...new Set(ids)].join(",")});`
  );
  return `[out:json][timeout:${timeoutSeconds}];(${parts.join("")});out tags center;`;
}

export type OsmTags = Record<string, string>;

export interface OsmElement {
  type: string;
  id: number;
  tags?: OsmTags;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
}

/** Fields this module is willing to write. Anything absent stays untouched. */
export interface Enrichment {
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string[];
  is24h?: boolean;
  city?: string;
}

const firstTag = (tags: OsmTags, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = tags[key]?.trim();
    if (value) return value;
  }
  return undefined;
};

/**
 * A phone as a person would dial it.
 *
 * OSM stores several formats ("+995 595 55 48 66", "+995322422222", or a
 * semicolon-separated list). Take the first number, keep its spacing — the UI
 * shows it verbatim and a Georgian reader expects the grouped form — and drop
 * anything that is not plausibly a number.
 */
export function normalizePhone(raw?: string): string | undefined {
  if (!raw) return undefined;
  const first = raw.split(";")[0].trim();
  const digits = first.replace(/\D/g, "");
  if (digits.length < 6) return undefined;
  return first;
}

/** OSM `opening_hours` → the array of lines the model stores. */
export function parseOpeningHours(raw?: string): { lines?: string[]; is24h?: boolean } {
  if (!raw) return {};
  const value = raw.trim();
  if (!value) return {};
  // "24/7" is the whole value, not a line to display — the page already has a
  // 24/7 badge driven by `is24h`, and the clinics that have it are exactly what
  // "ვეტკლინიკა 24 საათი" searches for.
  if (/^24\s*\/\s*7$/.test(value)) return { is24h: true };
  const lines = value
    .split(";")
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.length ? { lines } : {};
}

/**
 * What we would like to store for one OSM element.
 *
 * `addr:street` + `addr:housenumber` is assembled into one line because that is
 * how the model stores an address and how the page renders it.
 */
export function fieldsFromOsmTags(
  el: OsmElement,
  locale: "ka" | "en" = "ka"
): Enrichment {
  const tags = el.tags ?? {};
  const out: Enrichment = {};

  const street = firstTag(tags, ["addr:street"]);
  const houseNumber = firstTag(tags, ["addr:housenumber"]);
  const address = [street, houseNumber].filter(Boolean).join(" ");
  if (address) out.address = address;

  const phone = normalizePhone(
    firstTag(tags, ["phone", "contact:phone", "contact:mobile", "mobile"])
  );
  if (phone) out.phone = phone;

  // Only http(s) reaches the row: a website is rendered into an href, and the
  // stored-XSS fix for that field must not be undone by an importer.
  const website = safeExternalUrl(firstTag(tags, ["website", "contact:website"]));
  if (website) out.website = website;

  const { lines, is24h } = parseOpeningHours(tags.opening_hours);
  if (lines) out.openingHours = lines;
  if (is24h) out.is24h = true;

  // `addr:city` when OSM knows it, otherwise the town the coordinates fall in —
  // the same derivation the pages already display, but persisted so the city
  // filter and the sitemap see it too.
  const city =
    firstTag(tags, ["addr:city"]) ??
    cityFromCoords(el.lat ?? el.center?.lat, el.lon ?? el.center?.lon)?.[locale];
  if (city) out.city = city;

  return out;
}

const isBlank = (v: unknown): boolean =>
  v === undefined || v === null || (typeof v === "string" && v.trim() === "");

export interface BusinessFields {
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  openingHours?: string[] | null;
  is24h?: boolean | null;
  city?: string | null;
}

/**
 * The subset of an enrichment that is safe to write: blanks only.
 *
 * A field a human filled in — or a business owner corrected on their own page —
 * always wins over a re-scrape. OSM is a good source for a row that has
 * nothing; it is not an authority worth overwriting real data with, and a
 * silent overwrite of 133 rows is unrecoverable without a backup.
 *
 * `is24h` is only ever turned on, never off: a false value is the schema
 * default, so "not 24/7 in OSM" is indistinguishable from "nobody said".
 */
export function fillBlanksOnly(
  current: BusinessFields,
  incoming: Enrichment
): Partial<BusinessFields> {
  const update: Partial<BusinessFields> = {};

  if (incoming.address && isBlank(current.address)) update.address = incoming.address;
  if (incoming.phone && isBlank(current.phone)) update.phone = incoming.phone;
  if (incoming.website && isBlank(current.website)) update.website = incoming.website;
  if (incoming.city && isBlank(current.city)) update.city = incoming.city;
  if (incoming.openingHours?.length && !current.openingHours?.length) {
    update.openingHours = incoming.openingHours;
  }
  if (incoming.is24h && !current.is24h) update.is24h = true;

  return update;
}
