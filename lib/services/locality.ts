/**
 * Work out where a directory entry is when the entry itself does not say.
 *
 * Most of the services directory was imported from OpenStreetMap, and those
 * rows arrived with coordinates but no `city` — 66 of the 91 live entries have
 * an empty one. A business page that cannot name its own town is thin to a
 * reader and invisible to local search: "ვეტკლინიკა თბილისში" is the query, and
 * the page never says თბილისი anywhere.
 *
 * The coordinates are there, so the town is derivable without a geocoding
 * service and without touching the stored rows: nearest known city, within a
 * radius that keeps a village from being labelled as its nearest large town.
 * Display-only, so a later data cleanup can just fill `city` in and this stops
 * being consulted.
 */

/** Name in Georgian (matching `CITIES` in lib/marketplace/filters.ts, so a
 * derived locality is filterable) plus the Latin form for the English UI. */
export interface City {
  ka: string;
  en: string;
  lat: number;
  lng: number;
  /** Kilometres from the centre still considered "in" this city. */
  radiusKm: number;
}

/**
 * The towns worth resolving, largest first. Radii are deliberately modest —
 * being wrong about the town is worse than saying nothing, because a wrong
 * locality is a wrong signal in both structured data and the city filter.
 */
export const CITIES: City[] = [
  { ka: "თბილისი", en: "Tbilisi", lat: 41.7151, lng: 44.8271, radiusKm: 22 },
  { ka: "ბათუმი", en: "Batumi", lat: 41.6459, lng: 41.6417, radiusKm: 12 },
  { ka: "ქუთაისი", en: "Kutaisi", lat: 42.2679, lng: 42.6946, radiusKm: 12 },
  { ka: "რუსთავი", en: "Rustavi", lat: 41.5495, lng: 45.0028, radiusKm: 10 },
  { ka: "გორი", en: "Gori", lat: 41.9847, lng: 44.1164, radiusKm: 10 },
  { ka: "ზუგდიდი", en: "Zugdidi", lat: 42.5088, lng: 41.8709, radiusKm: 10 },
  { ka: "ფოთი", en: "Poti", lat: 42.1462, lng: 41.6725, radiusKm: 10 },
  { ka: "ქობულეთი", en: "Kobuleti", lat: 41.8214, lng: 41.7783, radiusKm: 8 },
  { ka: "ხაშური", en: "Khashuri", lat: 41.9906, lng: 43.6011, radiusKm: 8 },
  { ka: "სამტრედია", en: "Samtredia", lat: 42.1567, lng: 42.3428, radiusKm: 8 },
  { ka: "სენაკი", en: "Senaki", lat: 42.2703, lng: 42.0656, radiusKm: 8 },
  { ka: "ზესტაფონი", en: "Zestaponi", lat: 42.1119, lng: 43.0517, radiusKm: 8 },
  { ka: "მარნეული", en: "Marneuli", lat: 41.4761, lng: 44.8092, radiusKm: 8 },
  { ka: "თელავი", en: "Telavi", lat: 41.9192, lng: 45.4731, radiusKm: 8 },
  { ka: "ახალციხე", en: "Akhaltsikhe", lat: 41.6392, lng: 42.9826, radiusKm: 8 },
  { ka: "ოზურგეთი", en: "Ozurgeti", lat: 41.9247, lng: 42.0075, radiusKm: 8 },
  { ka: "კასპი", en: "Kaspi", lat: 41.9256, lng: 44.4258, radiusKm: 8 },
  { ka: "წყალტუბო", en: "Tskaltubo", lat: 42.3392, lng: 42.5942, radiusKm: 8 },
  { ka: "საგარეჯო", en: "Sagarejo", lat: 41.7364, lng: 45.3319, radiusKm: 8 },
  { ka: "ბორჯომი", en: "Borjomi", lat: 41.8394, lng: 43.3906, radiusKm: 8 },
  { ka: "მცხეთა", en: "Mtskheta", lat: 41.8458, lng: 44.7203, radiusKm: 8 },
  { ka: "გარდაბანი", en: "Gardabani", lat: 41.4592, lng: 45.0947, radiusKm: 8 },
  { ka: "ბოლნისი", en: "Bolnisi", lat: 41.4478, lng: 44.5386, radiusKm: 8 },
  { ka: "გურჯაანი", en: "Gurjaani", lat: 41.7442, lng: 45.8006, radiusKm: 8 },
  { ka: "ყვარელი", en: "Kvareli", lat: 41.9497, lng: 45.8114, radiusKm: 8 },
  { ka: "სიღნაღი", en: "Sighnaghi", lat: 41.6197, lng: 45.9214, radiusKm: 6 },
  { ka: "ლანჩხუთი", en: "Lanchkhuti", lat: 42.0894, lng: 42.0333, radiusKm: 8 },
  { ka: "ამბროლაური", en: "Ambrolauri", lat: 42.5211, lng: 43.1594, radiusKm: 8 },
  { ka: "მესტია", en: "Mestia", lat: 43.0431, lng: 42.7278, radiusKm: 8 },
  { ka: "სტეფანწმინდა", en: "Stepantsminda", lat: 42.6572, lng: 44.6417, radiusKm: 6 },
];

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in kilometres. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * The city a coordinate pair sits in, or null when it is not close enough to
 * any of them. Returns the whole record so a caller can pick the language.
 */
export function cityFromCoords(lat?: number | null, lng?: number | null): City | null {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  // Anything outside Georgia's bounding box is bad data, not a near miss.
  if (lat < 41 || lat > 43.7 || lng < 39.8 || lng > 46.8) return null;

  let best: { city: City; km: number } | null = null;
  for (const city of CITIES) {
    const km = distanceKm({ lat, lng }, city);
    if (km <= city.radiusKm && (!best || km < best.km)) best = { city, km };
  }
  return best?.city ?? null;
}

/**
 * The locality to show for a business, in the active language.
 *
 * A stored `city` always wins — it is what a human typed, and the derived value
 * is only a stand-in for the rows that never got one.
 */
export function localityFor(
  business: { city?: string | null; lat?: number | null; lng?: number | null },
  locale: "ka" | "en"
): string | null {
  const stored = business.city?.trim();
  if (stored) return stored;
  const derived = cityFromCoords(business.lat, business.lng);
  return derived ? derived[locale] : null;
}
