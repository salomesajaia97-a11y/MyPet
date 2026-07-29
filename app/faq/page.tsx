import type { Metadata } from "next";
import Link from "next/link";
import { getServerDictionary } from "@/lib/i18n/server";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, faqPageJsonLd, graph } from "@/lib/seo/jsonLd";
import { BRAND_KEYWORDS, buildKeywords, GENERAL_KEYWORDS } from "@/lib/seo/keywords";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getServerDictionary();
  return pageMetadata({
    locale,
    title: t.pages.faq.title,
    description: t.pages.faq.metaDescription,
    path: "/faq",
    keywords: buildKeywords(BRAND_KEYWORDS, GENERAL_KEYWORDS.slice(0, 8)),
  });
}

export default async function FaqPage() {
  const { t, locale } = await getServerDictionary();
  const { title, subtitle, metaDescription, items } = t.pages.faq;

  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <JsonLd
        data={graph(
          // FAQPage stands in for the WebPage node here — it is a WebPage
          // subtype, so emitting both would describe the same URL twice.
          faqPageJsonLd({
            locale,
            name: title,
            description: metaDescription,
            path: "/faq",
            items,
          }),
          breadcrumbJsonLd([
            { name: t.seo.breadcrumbs.home, path: "/" },
            { name: title, path: "/faq" },
          ]),
        )}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl sm:text-4xl font-black text-[#0F2830] mb-2">{title}</h1>
        <p className="text-stone-500 text-sm mb-8">{subtitle}</p>

        {/* Plain markup on purpose: the answers must be in the HTML a crawler
            or an answer engine reads, not behind a click. <details> would hide
            them from neither, but it also hides them from the reader. */}
        <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
          {items.map((item) => (
            <section key={item.q} className="p-6 sm:p-8">
              <h2 className="text-base sm:text-lg font-bold text-[#0F2830] mb-2">{item.q}</h2>
              <p className="text-stone-600 leading-relaxed">{item.a}</p>
            </section>
          ))}
        </div>

        <p className="text-sm text-stone-500 mt-8">
          {t.pages.faq.moreHelp}{" "}
          <Link href="/contact" className="font-semibold text-[#0E4A5C] hover:underline">
            {t.footer.contact}
          </Link>
        </p>
      </div>
    </div>
  );
}
