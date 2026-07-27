import type { Metadata } from "next";
import { getServerDictionary } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/metadata";
import { BRAND_KEYWORDS, buildKeywords, LOST_FOUND_KEYWORDS } from "@/lib/seo/keywords";

// The page itself is a client component (image upload + AI matching), so its
// metadata has to live in a layout.
export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerDictionary();
  return pageMetadata({
    locale,
    title: t.seo.lostFoundMatch.title,
    description: t.seo.lostFoundMatch.description,
    path: "/lost-found/match",
    keywords: buildKeywords(LOST_FOUND_KEYWORDS.slice(0, 18), BRAND_KEYWORDS),
  });
}

export default function LostFoundMatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
