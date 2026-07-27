import type { Metadata } from "next";
import { getServerDictionary } from "@/lib/i18n/server";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, graph, webPageJsonLd } from "@/lib/seo/jsonLd";
import { BRAND_KEYWORDS, buildKeywords, GENERAL_KEYWORDS } from "@/lib/seo/keywords";

// The title goes through the root's "%s · MyPet.ge" template, so pass the bare
// page name — `metaTitle` already ends in the brand and would double it.
export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getServerDictionary();
  return pageMetadata({
    locale,
    title: t.pages.about.title,
    description: t.pages.about.metaDescription,
    path: "/about",
    keywords: buildKeywords(BRAND_KEYWORDS, GENERAL_KEYWORDS.slice(0, 8)),
  });
}

export default async function AboutPage() {
  const { t, locale } = await getServerDictionary();
  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <JsonLd
        data={graph(
          webPageJsonLd({
            locale,
            type: "AboutPage",
            name: t.pages.about.title,
            description: t.pages.about.metaDescription,
            path: "/about",
          }),
          breadcrumbJsonLd([
            { name: t.seo.breadcrumbs.home, path: "/" },
            { name: t.pages.about.title, path: "/about" },
          ]),
        )}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl sm:text-4xl font-black text-[#0F2830] mb-2">
          {t.pages.about.title}
        </h1>
        <p className="text-stone-500 text-sm mb-8">{t.pages.about.subtitle}</p>

        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-5 text-stone-600 leading-relaxed">
          {t.pages.about.paragraphs.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
