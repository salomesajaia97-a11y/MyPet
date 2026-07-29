import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { RealBusinessCard } from "@/components/services/RealBusinessCard";
import { fetchDBBusinesses } from "@/lib/fetchBusinesses";
import { getServerDictionary } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, collectionPageJsonLd, graph } from "@/lib/seo/jsonLd";
import {
  BRAND_KEYWORDS,
  buildKeywords,
  CARE_KEYWORDS,
  HOTEL_KEYWORDS,
  PET_FRIENDLY_KEYWORDS,
  VET_KEYWORDS,
} from "@/lib/seo/keywords";
import { cityBySlug, locativeKa, type City } from "@/lib/services/locality";
import { groupByCity, MIN_PER_CITY_PAGE, rowsInCity } from "@/lib/services/cityIndex";

/**
 * "Vet clinics in Tbilisi" — one page per (category, city) pair.
 *
 * A single nationwide category page competes badly for a query that names a
 * town: the town appears nowhere in its title, and the list is mostly places in
 * the wrong city. These pages say the town in the title, the heading and the
 * body, and list only what is actually there.
 *
 * They exist only where there is enough to list (see MIN_PER_CITY_PAGE) —
 * a one-entry "city page" is a near-duplicate of the business's own page, which
 * is exactly what Google calls a doorway page. The cities are discovered from
 * the data, so no pair is ever invented, and the city of each row is resolved
 * from its coordinates when it has no stored city, which is what lets these
 * pages work before the directory is enriched.
 */

const CATEGORIES = ["vet-clinics", "pet-hotels", "pet-shops", "pet-friendly"] as const;
type Category = (typeof CATEGORIES)[number];

const isCategory = (value: string): value is Category =>
  (CATEGORIES as readonly string[]).includes(value);

/** category slug → the key its labels live under in the dictionary. */
const DICT_KEY: Record<Category, "vetClinics" | "petHotels" | "petShops" | "petFriendly"> = {
  "vet-clinics": "vetClinics",
  "pet-hotels": "petHotels",
  "pet-shops": "petShops",
  "pet-friendly": "petFriendly",
};

const KEYWORDS_BY_CATEGORY: Record<Category, string[]> = {
  "vet-clinics": VET_KEYWORDS,
  "pet-hotels": HOTEL_KEYWORDS,
  "pet-shops": CARE_KEYWORDS,
  "pet-friendly": PET_FRIENDLY_KEYWORDS,
};

/** Re-read at most hourly: the directory changes rarely and a crawler should
 * not cost a database query per hit. */
export const revalidate = 3600;

/** Fill `{slot}` placeholders in a dictionary template. */
const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));

/**
 * "in Tbilisi" / "თბილისში".
 *
 * Georgian needs the locative case — "ვეტკლინიკები თბილისი" is broken grammar
 * and matches the real query less well than "ვეტკლინიკები თბილისში".
 */
const inCity = (city: City, locale: Locale) =>
  locale === "en" ? `in ${city.en}` : locativeKa(city.ka);

const cityName = (city: City, locale: Locale) => (locale === "en" ? city.en : city.ka);

const getBusinesses = cache((category: Category) => fetchDBBusinesses(category));

/** The page's own data, or null when this pair does not deserve a page. */
const getCityPage = cache(async (category: Category, slug: string) => {
  const city = cityBySlug(slug);
  if (!city) return null;
  const all = await getBusinesses(category);
  const rows = rowsInCity(all, city);
  if (rows.length < MIN_PER_CITY_PAGE) return null;
  return { city, rows, total: all.length };
});

export async function generateMetadata({
  params,
}: PageProps<"/services/[category]/in/[city]">): Promise<Metadata> {
  const { category, city: slug } = await params;
  if (!isCategory(category)) return {};
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  const data = await getCityPage(category, slug);
  // No page, no metadata worth emitting — and definitely no index entry.
  if (!data) return { robots: { index: false, follow: false } };

  const { city, rows } = data;
  const copy = t.services.cityPages;
  const plural = copy.plural[DICT_KEY[category]];
  const where = inCity(city, locale);
  const title = `${plural} ${where}`;

  return pageMetadata({
    locale,
    title,
    description: fill(copy.metaDescription, {
      count: rows.length,
      plural: plural.toLowerCase(),
      cityLocative: where,
    }),
    path: `/services/${category}/in/${city.slug}`,
    // The city, in both languages and both cases, alongside the category's own
    // intent terms — this is the page that should own "<category> <city>".
    keywords: buildKeywords(
      [
        `${plural} ${where}`,
        `${plural.toLowerCase()} ${cityName(city, "ka")}`,
        `${plural.toLowerCase()} ${city.en.toLowerCase()}`,
        cityName(city, "ka"),
        locativeKa(city.ka),
        city.en,
      ],
      KEYWORDS_BY_CATEGORY[category].slice(0, 14),
      BRAND_KEYWORDS.slice(0, 4),
    ),
  });
}

export default async function CityCategoryPage({
  params,
}: PageProps<"/services/[category]/in/[city]">) {
  const { category, city: slug } = await params;
  if (!isCategory(category)) notFound();

  const { t, locale } = await getServerDictionary();
  const data = await getCityPage(category, slug);
  if (!data) notFound();

  const { city, rows } = data;
  const copy = t.services.cityPages;
  const plural = copy.plural[DICT_KEY[category]];
  const where = inCity(city, locale);
  const heading = `${plural} ${where}`;
  const path = `/services/${category}/in/${city.slug}`;

  // Sibling links, both directions: the same category in other cities, and the
  // other categories in this city. This is what turns a set of leaf pages into
  // a browsable grid a crawler can walk.
  const otherCities = groupByCity(await getBusinesses(category))
    .filter((g) => g.city.slug !== city.slug)
    .slice(0, 8);

  const otherCategories = (
    await Promise.all(
      CATEGORIES.filter((c) => c !== category).map(async (c) => ({
        category: c,
        count: rowsInCity(await getBusinesses(c), city).length,
      }))
    )
  ).filter((c) => c.count >= MIN_PER_CITY_PAGE);

  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <JsonLd
        data={graph(
          collectionPageJsonLd({
            locale,
            name: heading,
            description: fill(copy.metaDescription, {
              count: rows.length,
              plural: plural.toLowerCase(),
              cityLocative: where,
            }),
            path,
            items: rows.slice(0, 50).map((b) => ({
              name: b.name,
              path: `/services/${category}/${b._id}`,
              image: b.image || undefined,
            })),
            totalItems: rows.length,
          }),
          breadcrumbJsonLd([
            { name: t.seo.breadcrumbs.home, path: "/" },
            { name: t.seo.services.title, path: "/services" },
            { name: t.services.detail.back[DICT_KEY[category]], path: `/services/${category}` },
            { name: heading, path },
          ]),
        )}
      />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <h1 className="text-2xl sm:text-3xl font-black text-[#0F2830]">{heading}</h1>
        <p className="text-sm text-stone-600 max-w-2xl">
          {fill(copy.intro, { count: rows.length, cityLocative: where })}
        </p>

        <div className="grid gap-4">
          {rows.map((business) => (
            <RealBusinessCard
              key={business._id}
              business={business}
              href={`/services/${category}/${business._id}`}
            />
          ))}
        </div>

        {otherCategories.length > 0 && (
          <section className="space-y-2 pt-2">
            <h2 className="text-sm font-semibold text-[#0F2830]">
              {fill(copy.otherServices, { cityLocative: where })}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {otherCategories.map(({ category: other, count }) => (
                <li key={other}>
                  <Link
                    href={`/services/${other}/in/${city.slug}`}
                    className="inline-block bg-white border border-stone-200 rounded-full px-3 py-1.5 text-sm text-stone-700 hover:border-[#0E4A5C]/40 transition-colors"
                  >
                    {copy.plural[DICT_KEY[other]]} <span className="text-stone-400">{count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {otherCities.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-[#0F2830]">{copy.otherCities}</h2>
            <ul className="flex flex-wrap gap-2">
              {otherCities.map((group) => (
                <li key={group.city.slug}>
                  <Link
                    href={`/services/${category}/in/${group.city.slug}`}
                    className="inline-block bg-white border border-stone-200 rounded-full px-3 py-1.5 text-sm text-stone-700 hover:border-[#0E4A5C]/40 transition-colors"
                  >
                    {cityName(group.city, locale)}{" "}
                    <span className="text-stone-400">{group.rows.length}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Link
          href={`/services/${category}`}
          className="inline-block text-sm font-semibold text-[#0E4A5C] hover:underline"
        >
          {fill(copy.viewAll, { plural: plural.toLowerCase() })} →
        </Link>
      </div>
    </div>
  );
}
