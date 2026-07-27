import type { Locale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/siteUrl";
import { LOGO_SIZE, LOGO_URL, OG_IMAGE_URL, SITE_NAME, SITE_PROFILES } from "@/lib/seo/metadata";

/** Stable @id anchors so nodes can reference each other across pages. */
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

type Json = Record<string, unknown>;

const abs = (path: string) => `${SITE_URL}${path === "/" ? "/" : path}`;

/** Drop keys whose value is undefined/null/"" so no empty fields ship. */
function compact(obj: Json): Json {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );
}

/**
 * Organization node — the entity behind the site. Referenced by the WebSite
 * node and by every listing/business page as `publisher`, which is what lets
 * Google connect them into one knowledge entity.
 */
export function organizationJsonLd(description: string): Json {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    alternateName: ["MyPet", "MyPet Georgia", "მაიფეთი"],
    url: abs("/"),
    description,
    logo: {
      "@type": "ImageObject",
      url: LOGO_URL,
      width: LOGO_SIZE,
      height: LOGO_SIZE,
      caption: SITE_NAME,
    },
    image: OG_IMAGE_URL,
    sameAs: SITE_PROFILES,
    email: "info@mypet.ge",
    areaServed: { "@type": "Country", name: "Georgia" },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "info@mypet.ge",
      availableLanguage: ["ka", "en"],
    },
  };
}

/**
 * WebSite node with a SearchAction. The marketplace search lives on
 * `/buy-sell?q=` — the same param every browse route reads — so a sitelinks
 * search box lands users on real results.
 */
export function websiteJsonLd(locale: Locale, name: string, description: string): Json {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: abs("/"),
    name,
    alternateName: ["MyPet.ge", "mypetge", "mypetge.online"],
    description,
    inLanguage: locale === "en" ? "en" : "ka",
    publisher: { "@id": ORGANIZATION_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/buy-sell?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * A single content page. `AboutPage` / `ContactPage` are the schema.org
 * subtypes Google and AI answer engines use to tell "who runs this site" and
 * "how do I reach them" apart from ordinary body pages — worth the extra word.
 */
export function webPageJsonLd({
  locale,
  name,
  description,
  path,
  type = "WebPage",
}: {
  locale: Locale;
  name: string;
  description: string;
  path: string;
  type?: "WebPage" | "AboutPage" | "ContactPage";
}): Json {
  return {
    "@type": type,
    "@id": `${abs(path)}#webpage`,
    url: abs(path),
    name,
    description,
    inLanguage: locale === "en" ? "en" : "ka",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    primaryImageOfPage: { "@type": "ImageObject", url: OG_IMAGE_URL },
  };
}

/**
 * The site's main sections as SiteNavigationElements. Emitted once, on the
 * homepage: it hands a crawler the whole information architecture from the
 * entry point instead of making it walk the nav, which is what earns sitelinks
 * in Google and lets an AI answer engine name the right section directly.
 */
export function siteNavigationJsonLd(
  items: { name: string; path: string; description?: string }[]
): Json {
  return {
    "@type": "ItemList",
    "@id": `${abs("/")}#sitenav`,
    itemListElement: items.map((item, i) =>
      compact({
        "@type": "SiteNavigationElement",
        position: i + 1,
        name: item.name,
        description: item.description,
        url: abs(item.path),
      })
    ),
  };
}

/** Breadcrumb trail. Pass paths relative to the site root. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]): Json {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: abs(item.path),
    })),
  };
}

/**
 * A browse/category page: CollectionPage plus an ItemList of the entries
 * actually rendered, so Google sees the page as a real index rather than a
 * bare template.
 */
export function collectionPageJsonLd({
  locale,
  name,
  description,
  path,
  items,
  totalItems,
  keywords,
}: {
  locale: Locale;
  name: string;
  description: string;
  path: string;
  items: { name: string; path: string; image?: string }[];
  totalItems?: number;
  keywords?: string[];
}): Json {
  return compact({
    "@type": "CollectionPage",
    "@id": `${abs(path)}#collection`,
    url: abs(path),
    name,
    description,
    inLanguage: locale === "en" ? "en" : "ka",
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORGANIZATION_ID },
    keywords: keywords?.length ? keywords.join(", ") : undefined,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: totalItems ?? items.length,
      itemListElement: items.map((item, i) =>
        compact({
          "@type": "ListItem",
          position: i + 1,
          url: abs(item.path),
          name: item.name,
          image: item.image,
        })
      ),
    },
  });
}

/** Wrap nodes in a single @graph document — one script tag per page. */
export function graph(...nodes: (Json | null | undefined)[]): Json {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.filter(Boolean) as Json[],
  };
}
