import type { Metadata } from "next";
import { ServicesTabs } from "@/components/services/ServicesTabs";
import { ServicesSearch } from "@/components/services/ServicesSearch";
import { ServicesFab } from "@/components/services/ServicesFab";
import { fetchDBBusinesses } from "@/lib/fetchBusinesses";
import { getServerDictionary } from "@/lib/i18n/server";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, collectionPageJsonLd, graph } from "@/lib/seo/jsonLd";
import {
  BRAND_KEYWORDS,
  buildKeywords,
  CARE_KEYWORDS,
  CITY_KEYWORDS,
  HOTEL_KEYWORDS,
  PET_FRIENDLY_KEYWORDS,
  VET_KEYWORDS,
} from "@/lib/seo/keywords";

export const dynamic = "force-dynamic";

const CATEGORIES = ["vet-clinics", "pet-hotels", "pet-shops", "pet-friendly"];

const KEYWORDS = buildKeywords(
  VET_KEYWORDS,
  HOTEL_KEYWORDS,
  CARE_KEYWORDS,
  PET_FRIENDLY_KEYWORDS,
  CITY_KEYWORDS,
  BRAND_KEYWORDS,
);

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerDictionary();
  return pageMetadata({
    locale,
    title: t.seo.services.title,
    description: t.seo.services.description,
    path: "/services",
    keywords: KEYWORDS,
  });
}

export default async function ServicesPage() {
  const { locale, t } = await getServerDictionary();
  // Live businesses across every category — the index is a combined feed;
  // each card links to its own category's detail page via ServicesSearch.
  const lists = await Promise.all(CATEGORIES.map((c) => fetchDBBusinesses(c)));
  const businesses = lists.flat();

  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <JsonLd
        data={graph(
          collectionPageJsonLd({
            locale,
            name: t.seo.services.title,
            description: t.seo.services.description,
            path: "/services",
            keywords: KEYWORDS.slice(0, 25),
            items: businesses.slice(0, 50).map((b) => ({
              name: b.name,
              path: `/services/${b.category}/${b._id}`,
              image: b.image || undefined,
            })),
            totalItems: businesses.length,
          }),
          breadcrumbJsonLd([
            { name: t.seo.breadcrumbs.home, path: "/" },
            { name: t.seo.services.title, path: "/services" },
          ]),
        )}
      />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-3xl font-black text-[#0F2830] mb-1">{t.services.index.title}</h1>
          <p className="text-stone-500 text-sm">{t.services.index.subtitle}</p>
        </div>

        <ServicesTabs active="" />
        <ServicesSearch businesses={businesses} />
      </div>
      <ServicesFab />
    </div>
  );
}
