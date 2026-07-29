/**
 * Turn a coordinate pair into a street address, via OSM's Nominatim.
 *
 * The reason this exists rather than only re-reading the OSM objects: for every
 * directory row that has no address, the OSM object has no `addr:*` tags either.
 * The import did not drop them — nobody ever tagged them. What OSM *does* know
 * is which street the point sits on, which is what its reverse geocoder answers,
 * and for the rows in question it answers well: a Georgian street name, a house
 * number, the district and the city.
 *
 * Nominatim's usage policy is strict and non-negotiable: at most one request per
 * second, a real User-Agent with a contact, no bulk or parallel querying, and
 * results must be stored rather than re-fetched. That is why enrichment is a
 * manual admin action with a per-run cap, not a cron over the whole table.
 */

/** The subset of a Nominatim `jsonv2` reverse response this reads. */
export interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  house_number?: string;
  suburb?: string;
  neighbourhood?: string;
  city_district?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
}

export interface NominatimResponse {
  address?: NominatimAddress;
  error?: string;
}

export interface GeocodedPlace {
  address?: string;
  neighborhood?: string;
  city?: string;
}

const clean = (v?: string) => {
  const s = v?.trim();
  return s ? s : undefined;
};

/**
 * Nominatim labels a Tbilisi district "საბურთალოს რაიონი". The administrative
 * suffix is noise inside an address line, and dropping it puts the value closer
 * to the "საბურთალო" form the marketplace district list uses (not identical —
 * the genitive ending stays).
 */
export function stripDistrictSuffix(value: string): string {
  return value.replace(/\s*რაიონი$/u, "").trim();
}

/** Parse a reverse-geocode response into the fields the model stores. */
export function placeFromNominatim(payload: NominatimResponse): GeocodedPlace {
  if (payload.error) return {};
  const a = payload.address ?? {};

  const street = clean(a.road) ?? clean(a.pedestrian);
  const houseNumber = clean(a.house_number);
  // House number after the street: the order a Georgian address is written in,
  // and the order the existing rows use.
  const address = street ? [street, houseNumber].filter(Boolean).join(" ") : undefined;

  const rawNeighborhood =
    clean(a.suburb) ?? clean(a.neighbourhood) ?? clean(a.city_district);
  const city = clean(a.city) ?? clean(a.town) ?? clean(a.village) ?? clean(a.municipality);

  const out: GeocodedPlace = {};
  if (address) out.address = address;
  if (rawNeighborhood) out.neighborhood = stripDistrictSuffix(rawNeighborhood);
  if (city) out.city = city;
  // A neighbourhood identical to the city is noise, not detail.
  if (out.neighborhood && out.city && out.neighborhood === out.city) delete out.neighborhood;
  return out;
}

/** Reverse-geocode URL for a point, in the requested language. */
export function reverseUrl(lat: number, lng: number, locale: "ka" | "en" = "ka"): string {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(lat),
    lon: String(lng),
    // zoom 18 is building level: any closer returns the same, any further loses
    // the house number.
    zoom: "18",
    "accept-language": locale,
  });
  return `https://nominatim.openstreetmap.org/reverse?${params}`;
}
