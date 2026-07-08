// Shared marketplace filter vocabulary so the home quick-search and the
// results-page search bar agree on the exact param values. Species are stored
// in the DB as English slugs ("dog", "cat", …) but shown to users in Georgian,
// so we keep both and map between them.

// Canonical species vocabulary — the Georgian labels here MUST match the
// new-listing form's options, since those are what get stored (as slugs) and
// what the search maps back. Slug ↔ ka in one place so nothing drifts.
export const SPECIES = [
  { slug: "dog", ka: "ძაღლი" },
  { slug: "cat", ka: "კატა" },
  { slug: "bird", ka: "ფრინველი" },
  { slug: "rabbit", ka: "კურდღელი" },
  { slug: "reptile", ka: "რეპტილია" },
  { slug: "other", ka: "სხვა" },
] as const;

export const CITIES = [
  "თბილისი", "ბათუმი", "ქუთაისი", "რუსთავი", "გორი", "ზუგდიდი", "ფოთი",
  "ხაშური", "სამტრედია", "სენაკი", "ზესტაფონი", "მარნეული", "თელავი",
  "ახალციხე", "ქობულეთი", "ოზურგეთი", "კასპი", "ჭიათურა", "წყალტუბო",
  "საგარეჯო", "გარდაბანი", "ბორჯომი", "ტყიბული", "ხონი", "ბოლნისი",
  "ახალქალაქი", "გურჯაანი", "მცხეთა", "ყვარელი", "ახმეტა", "ლაგოდეხი",
  "საჩხერე", "დუშეთი", "სიღნაღი", "ლანჩხუთი", "მარტვილი", "ამბროლაური",
  "მესტია", "სტეფანწმინდა",
] as const;

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
const FILTER_KEYS = [
  "species",
  "city",
  "q",
  "status",
  "sex",
  "minPrice",
  "maxPrice",
] as const;

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

/** Escape user text before using it inside a RegExp. */
export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Build the MongoDB filter for a listing query from a plain params object.
 * Pure (no DB access) so it's shared by the API route and the direct-DB
 * page helper — the single source of truth for how a search maps to a query.
 */
export function buildListingFilter(
  type: string,
  params: Record<string, string | string[] | undefined>
): Record<string, unknown> {
  const get = (k: string): string | undefined => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const filter: Record<string, unknown> = { type };

  // Species arrives in Georgian ("ძაღლი"); the DB stores English slugs.
  const species = get("species");
  if (species) filter.species = speciesToSlug(species) || species;

  const status = get("status");
  if (status) filter.status = status;
  const sex = get("sex");
  if (sex) filter.sex = sex;

  // Numeric price range (buy-sell / mating). Ignore non-numeric input.
  const price: Record<string, number> = {};
  const minRaw = get("minPrice");
  const maxRaw = get("maxPrice");
  const min = Number(minRaw);
  const max = Number(maxRaw);
  if (minRaw && !Number.isNaN(min)) price.$gte = min;
  if (maxRaw && !Number.isNaN(max)) price.$lte = max;
  if (Object.keys(price).length) filter.price = price;

  // City matches the free-text `location` field — the city itself or any of
  // its known districts (case-insensitive substring).
  const city = get("city");
  if (city) {
    const pattern = locationMatchTerms(city).map(escapeRegex).join("|");
    filter.location = { $regex: pattern, $options: "i" };
  }

  // Free-text query matches breed, description, or location — plus the species
  // slug when the query is itself a Georgian species label ("ძაღლი" → "dog").
  const q = get("q");
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: "i" };
    const or: Record<string, unknown>[] = [
      { breed: rx },
      { description: rx },
      { location: rx },
    ];
    const slug = speciesToSlug(q);
    if (slug) or.push({ species: slug });
    filter.$or = or;
  }

  return filter;
}
