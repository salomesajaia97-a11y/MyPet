import { distanceKm } from "@/lib/services/locality";

/**
 * Pick the businesses to show as "nearby" on a detail page.
 *
 * Two reasons this exists. For a reader, a directory entry with no hours, no
 * phone and a one-line description is a dead end — the next-nearest clinic is
 * the useful thing on the page. For a crawler, these pages currently link only
 * back to their category, so every one of them is a leaf: nothing flows between
 * the 133 business pages, and a page with no internal links pointing at it is
 * the one Google is likeliest to leave out of the index.
 *
 * Ranking, in order of preference:
 *  1. real distance, when both entries have coordinates;
 *  2. same stored city;
 *  3. anything else, so the block is never empty on a row with no data.
 */

export interface NearbyCandidate {
  _id: string;
  name: string;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
}

const hasCoords = (x: {
  lat?: number | null;
  lng?: number | null;
}): x is { lat: number; lng: number } =>
  typeof x.lat === "number" &&
  typeof x.lng === "number" &&
  Number.isFinite(x.lat) &&
  Number.isFinite(x.lng);

export function rankNearby<T extends NearbyCandidate>(
  current: NearbyCandidate,
  candidates: T[],
  limit = 6
): (T & { km?: number })[] {
  const sameCity = current.city?.trim().toLowerCase() || null;
  const origin = hasCoords(current) ? current : null;

  // The ranking keys live beside the candidate rather than spread into it, so
  // `cityMatch` cannot leak into what the caller renders.
  const scored = candidates
    .filter((c) => c._id !== current._id)
    .map((item) => ({
      item,
      km: origin && hasCoords(item) ? distanceKm(origin, item) : undefined,
      cityMatch: !!sameCity && item.city?.trim().toLowerCase() === sameCity,
    }));

  scored.sort((a, b) => {
    // A measured distance always beats a guess at relatedness.
    if (a.km !== undefined && b.km !== undefined) return a.km - b.km;
    if (a.km !== undefined) return -1;
    if (b.km !== undefined) return 1;
    if (a.cityMatch !== b.cityMatch) return a.cityMatch ? -1 : 1;
    return 0;
  });

  return scored.slice(0, limit).map(({ item, km }) => ({ ...item, km }));
}
