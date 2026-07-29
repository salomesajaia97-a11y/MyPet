import Link from "next/link";
import { getServerDictionary } from "@/lib/i18n/server";
import { groupByCity, type CityGroupable } from "@/lib/services/cityIndex";

/**
 * "Browse by city" chips for a category page.
 *
 * The city landing pages are worth nothing if nothing links to them: a page a
 * crawler can only reach from the sitemap is the last one it bothers with. This
 * is also the useful way to browse a nationwide directory — most people want the
 * clinics in their own town, not all 26 in the country.
 *
 * Cities come from the data, so a chip never points at an empty page.
 */
export async function CityLinks({
  category,
  businesses,
}: {
  category: string;
  businesses: CityGroupable[];
}) {
  const { t, locale } = await getServerDictionary();
  const groups = groupByCity(businesses);
  if (groups.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-[#0F2830]">
        {t.services.cityPages.otherCities}
      </h2>
      <ul className="flex flex-wrap gap-2">
        {groups.map(({ city, rows }) => (
          <li key={city.slug}>
            <Link
              href={`/services/${category}/in/${city.slug}`}
              className="inline-block bg-white border border-stone-200 rounded-full px-3 py-1.5 text-sm text-stone-700 hover:border-[#0E4A5C]/40 transition-colors"
            >
              {locale === "en" ? city.en : city.ka}{" "}
              <span className="text-stone-400">{rows.length}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
