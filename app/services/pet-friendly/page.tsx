import type { Metadata } from "next";
import { ServicesTabs } from "@/components/services/ServicesTabs";
import { ServicesSearch } from "@/components/services/ServicesSearch";
import { ServicesFab } from "@/components/services/ServicesFab";
import { CityLinks } from "@/components/services/CityLinks";
import { MapPanel } from "@/components/services/MapPanel";
import { fetchDBBusinesses } from "@/lib/fetchBusinesses";
import { getServerDictionary } from "@/lib/i18n/server";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, collectionPageJsonLd, graph } from "@/lib/seo/jsonLd";
import {
  BRAND_KEYWORDS,
  buildKeywords,
  CITY_KEYWORDS,
  PET_FRIENDLY_KEYWORDS,
} from "@/lib/seo/keywords";

export const dynamic = "force-dynamic";

const KEYWORDS = buildKeywords(PET_FRIENDLY_KEYWORDS, CITY_KEYWORDS, BRAND_KEYWORDS);

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerDictionary();
  return pageMetadata({
    locale,
    title: t.seo.petFriendly.title,
    description: t.seo.petFriendly.description,
    path: "/services/pet-friendly",
    keywords: KEYWORDS,
  });
}

export default async function PetFriendlyPage() {
  const { locale, t } = await getServerDictionary();
  const businesses = await fetchDBBusinesses("pet-friendly");

  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <JsonLd
        data={graph(
          collectionPageJsonLd({
            locale,
            name: t.seo.petFriendly.title,
            description: t.seo.petFriendly.description,
            path: "/services/pet-friendly",
            keywords: KEYWORDS.slice(0, 25),
            items: businesses.slice(0, 50).map((b) => ({
              name: b.name,
              path: `/services/pet-friendly/${b._id}`,
              image: b.image || undefined,
            })),
            totalItems: businesses.length,
          }),
          breadcrumbJsonLd([
            { name: t.seo.breadcrumbs.home, path: "/" },
            { name: t.seo.services.title, path: "/services" },
            { name: t.seo.petFriendly.title, path: "/services/pet-friendly" },
          ]),
        )}
      />
      <div className="max-w-7xl mx-auto px-4 py-6 pb-28 lg:pb-6 space-y-5">
        <div>
          <h1 className="text-3xl font-black text-[#0F2830] mb-1">{t.services.categories.petFriendly.title}</h1>
          <p className="text-stone-500 text-sm">{t.services.categories.petFriendly.subtitle}</p>
        </div>
        <ServicesTabs active="pet-friendly" />

        <div className="flex items-center gap-4 text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            {t.services.petFriendlyLegend.indoor}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            {t.services.petFriendlyLegend.outdoor}
          </span>
        </div>

        {/* ─── Split screen: search + list (left) + map (right) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5 items-start">
          {/* Left — search + places */}
          <ServicesSearch businesses={businesses} category="pet-friendly" />

          {/* Right — live Leaflet map */}
          <MapPanel businesses={businesses} />
        </div>

        <CityLinks category="pet-friendly" businesses={businesses} />
      </div>
      <ServicesFab />
    </div>
  );
}
