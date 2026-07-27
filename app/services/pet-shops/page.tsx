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
} from "@/lib/seo/keywords";

export const dynamic = "force-dynamic";

const KEYWORDS = buildKeywords(CARE_KEYWORDS, CITY_KEYWORDS, BRAND_KEYWORDS);

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerDictionary();
  return pageMetadata({
    locale,
    title: t.seo.petShops.title,
    description: t.seo.petShops.description,
    path: "/services/pet-shops",
    keywords: KEYWORDS,
  });
}

export default async function PetShopsPage() {
  const { locale, t } = await getServerDictionary();
  const businesses = await fetchDBBusinesses("pet-shops");

  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <JsonLd
        data={graph(
          collectionPageJsonLd({
            locale,
            name: t.seo.petShops.title,
            description: t.seo.petShops.description,
            path: "/services/pet-shops",
            keywords: KEYWORDS.slice(0, 25),
            items: businesses.slice(0, 50).map((b) => ({
              name: b.name,
              path: `/services/pet-shops/${b._id}`,
              image: b.image || undefined,
            })),
            totalItems: businesses.length,
          }),
          breadcrumbJsonLd([
            { name: t.seo.breadcrumbs.home, path: "/" },
            { name: t.seo.services.title, path: "/services" },
            { name: t.seo.petShops.title, path: "/services/pet-shops" },
          ]),
        )}
      />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-3xl font-black text-[#0F2830] mb-1">{t.services.categories.petShops.title}</h1>
          <p className="text-stone-500 text-sm">{t.services.categories.petShops.subtitle}</p>
        </div>
        <ServicesTabs active="pet-shops" />
        <ServicesSearch businesses={businesses} category="pet-shops" />
      </div>
      <ServicesFab />
    </div>
  );
}
