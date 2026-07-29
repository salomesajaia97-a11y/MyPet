import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { getServerDictionary } from "@/lib/i18n/server";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata, SITE_EMAIL } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, graph, webPageJsonLd } from "@/lib/seo/jsonLd";
import { BRAND_KEYWORDS, buildKeywords } from "@/lib/seo/keywords";

// Bare page name: the root's "%s · MyPetge.online" template adds the brand.
export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getServerDictionary();
  return pageMetadata({
    locale,
    title: t.pages.contact.title,
    description: t.pages.contact.metaDescription,
    path: "/contact",
    keywords: buildKeywords(BRAND_KEYWORDS),
  });
}

// Email only, deliberately. The Telegram and Messenger cards that used to sit
// here advertised accounts that do not exist — @mypetge is unclaimed and the
// Messenger card was an `href="#"` that scrolled to the top. A contact channel
// nobody answers is worse than one channel that works, and a dead handle in
// `sameAs` is a dead end for Google's entity graph too.
const CHANNELS = [
  {
    label: "Email",
    value: SITE_EMAIL,
    href: `mailto:${SITE_EMAIL}`,
    Icon: Mail,
  },
];

export default async function ContactPage() {
  const { t, locale } = await getServerDictionary();
  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <JsonLd
        data={graph(
          webPageJsonLd({
            locale,
            type: "ContactPage",
            name: t.pages.contact.title,
            description: t.pages.contact.metaDescription,
            path: "/contact",
          }),
          breadcrumbJsonLd([
            { name: t.seo.breadcrumbs.home, path: "/" },
            { name: t.pages.contact.title, path: "/contact" },
          ]),
        )}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl sm:text-4xl font-black text-[#0F2830] mb-2">
          {t.pages.contact.title}
        </h1>
        <p className="text-stone-500 text-sm mb-8">
          {t.pages.contact.subtitle}
        </p>

        <div className="grid gap-4 sm:max-w-sm">
          {CHANNELS.map(({ label, value, href, Icon }) => (
            <Link
              key={label}
              href={href}
              className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col items-start gap-3 hover:border-[#0E4A5C]/40 transition-colors"
            >
              <span className="w-10 h-10 flex items-center justify-center rounded-full border border-stone-200 text-[#0E4A5C]">
                <Icon className="w-5 h-5" strokeWidth={1.75} />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                {label}
              </span>
              <span className="text-sm text-stone-700 font-medium">{value}</span>
            </Link>
          ))}
        </div>

        {/* Most questions that reach an inbox are already answered on /faq, and
            the link is worth having for its own sake — it is the one page here
            written to be read by a search engine. */}
        <p className="text-sm text-stone-500 mt-8">
          {t.pages.contact.faqHint}{" "}
          <Link href="/faq" className="font-semibold text-[#0E4A5C] hover:underline">
            {t.footer.faq}
          </Link>
        </p>
      </div>
    </div>
  );
}
