import type { Metadata } from "next";
import { getServerDictionary } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/metadata";
import { BRAND_KEYWORDS, buildKeywords } from "@/lib/seo/keywords";

// The pricing page is a client component, so its metadata lives here.
export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerDictionary();
  return pageMetadata({
    locale,
    title: t.seo.vip.title,
    description: t.seo.vip.description,
    path: "/vip",
    keywords: buildKeywords(
      [
        "vip განცხადება",
        "განცხადების გამორჩევა",
        "vip gancxadeba",
        "ცხოველების განცხადების რეკლამა",
        "listing promotion Georgia",
      ],
      BRAND_KEYWORDS,
    ),
  });
}

export default function VipLayout({ children }: { children: React.ReactNode }) {
  return children;
}
