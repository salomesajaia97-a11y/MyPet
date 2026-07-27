import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { getServerDictionary } from "@/lib/i18n/server";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo/metadata";
import { graph, siteNavigationJsonLd, webPageJsonLd } from "@/lib/seo/jsonLd";
import { SITE_KEYWORDS } from "@/lib/seo/keywords";

/**
 * The homepage itself is a client component (`HomeClient`) because of the
 * search widgets and live counters. This server shell exists so it can still
 * export `generateMetadata` — without it the page inherits the root layout's
 * metadata, and the canonical URL in particular has to be stated per page
 * rather than defaulted, or every page that forgets one silently claims to be
 * the homepage.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getServerDictionary();
  return pageMetadata({
    locale,
    title: t.common.metaTitle,
    description: t.common.metaDescription,
    path: "/",
    keywords: SITE_KEYWORDS,
    // metaTitle already opens with "MyPet.ge —"; the template would repeat it.
    absoluteTitle: true,
  });
}

export default async function HomePage() {
  const { t, locale } = await getServerDictionary();

  // The homepage is the entry point a crawler is most likely to reach first,
  // so it carries the site's information architecture. Organization + WebSite
  // already come from the root layout.
  const sections = [
    { name: t.seo.buySell.title, path: "/buy-sell", description: t.seo.buySell.description },
    { name: t.seo.adoption.title, path: "/adoption", description: t.seo.adoption.description },
    { name: t.seo.mating.title, path: "/mating", description: t.seo.mating.description },
    { name: t.seo.lostFound.title, path: "/lost-found", description: t.seo.lostFound.description },
    { name: t.seo.services.title, path: "/services", description: t.seo.services.description },
    {
      name: t.seo.vetClinics.title,
      path: "/services/vet-clinics",
      description: t.seo.vetClinics.description,
    },
    {
      name: t.seo.petHotels.title,
      path: "/services/pet-hotels",
      description: t.seo.petHotels.description,
    },
    {
      name: t.seo.petShops.title,
      path: "/services/pet-shops",
      description: t.seo.petShops.description,
    },
    {
      name: t.seo.petFriendly.title,
      path: "/services/pet-friendly",
      description: t.seo.petFriendly.description,
    },
  ];

  return (
    <>
      <JsonLd
        data={graph(
          webPageJsonLd({
            locale,
            name: t.common.metaTitle,
            description: t.common.metaDescription,
            path: "/",
          }),
          siteNavigationJsonLd(sections),
        )}
      />
      <HomeClient />
    </>
  );
}
