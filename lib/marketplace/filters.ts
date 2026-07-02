// Shared marketplace filter vocabulary so the home quick-search and the
// results-page search bar agree on the exact param values. Species are stored
// in the DB as English slugs ("dog", "cat", …) but shown to users in Georgian,
// so we keep both and map between them.

export const SPECIES = [
  { slug: "dog", ka: "ძაღლი" },
  { slug: "cat", ka: "კატა" },
  { slug: "bird", ka: "ჩიტი" },
  { slug: "rabbit", ka: "კურდღელი" },
  { slug: "other", ka: "სხვა" },
] as const;

export const CITIES = ["თბილისი", "ბათუმი", "ქუთაისი", "რუსთავი", "გორი"] as const;

// Districts that belong to a city, so a city filter also matches listings whose
// location is stored as just the district (e.g. "ვაკე" → part of თბილისი).
export const CITY_DISTRICTS: Record<string, string[]> = {
  თბილისი: [
    "ვაკე",
    "საბურთალო",
    "გლდანი",
    "ისანი",
    "სამგორი",
    "დიდუბე",
    "ჩუღურეთი",
    "კრწანისი",
    "მთაწმინდა",
    "ნაძალადევი",
  ],
};

/** All location strings that should match a given city filter. */
export const locationMatchTerms = (city: string): string[] => [
  city,
  ...(CITY_DISTRICTS[city] ?? []),
];

/** Georgian species label → DB slug (e.g. "ძაღლი" → "dog"). "" if unknown. */
export const speciesToSlug = (ka: string): string =>
  SPECIES.find((s) => s.ka === ka)?.slug ?? "";

/** DB slug → Georgian species label (e.g. "dog" → "ძაღლი"). "" if unknown. */
export const speciesToKa = (slug: string): string =>
  SPECIES.find((s) => s.slug === slug)?.ka ?? "";

/** Filter params forwarded from a results page's URL to the listings API. */
const FILTER_KEYS = ["species", "city", "q", "pedigree", "status"] as const;

/** Build the API query string from a page's resolved `searchParams`. */
export function buildListingQuery(
  sp: Record<string, string | string[] | undefined>
): string {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = sp[key];
    const single = Array.isArray(value) ? value[0] : value;
    if (single) params.set(key, single);
  }
  return params.toString();
}
