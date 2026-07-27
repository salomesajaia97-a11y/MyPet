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
  CITY_KEYWORDS,
  VET_KEYWORDS,
} from "@/lib/seo/keywords";

export const dynamic = "force-dynamic";

const KEYWORDS = buildKeywords(VET_KEYWORDS, CITY_KEYWORDS, BRAND_KEYWORDS);

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerDictionary();
  return pageMetadata({
    locale,
    title: t.seo.vetClinics.title,
    description: t.seo.vetClinics.description,
    path: "/services/vet-clinics",
    keywords: KEYWORDS,
  });
}

export default async function VetClinicsPage() {
  const { locale, t } = await getServerDictionary();
  const businesses = await fetchDBBusinesses("vet-clinics");

  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <JsonLd
        data={graph(
          collectionPageJsonLd({
            locale,
            name: t.seo.vetClinics.title,
            description: t.seo.vetClinics.description,
            path: "/services/vet-clinics",
            keywords: KEYWORDS.slice(0, 25),
            items: businesses.slice(0, 50).map((b) => ({
              name: b.name,
              path: `/services/vet-clinics/${b._id}`,
              image: b.image || undefined,
            })),
            totalItems: businesses.length,
          }),
          breadcrumbJsonLd([
            { name: t.seo.breadcrumbs.home, path: "/" },
            { name: t.seo.services.title, path: "/services" },
            { name: t.seo.vetClinics.title, path: "/services/vet-clinics" },
          ]),
        )}
      />
      <div className="max-w-5xl mx-auto px-4 py-6 pb-28 lg:pb-6 space-y-5">
        <div>
          <h1 className="text-3xl font-black text-[#0F2830] mb-1">{t.services.categories.vetClinics.title}</h1>
          <p className="text-stone-500 text-sm">{t.services.categories.vetClinics.subtitle}</p>
        </div>
        <ServicesTabs active="vet-clinics" />
        <ServicesSearch businesses={businesses} category="vet-clinics" />
      </div>
      <ServicesFab />
    </div>
  );
}
