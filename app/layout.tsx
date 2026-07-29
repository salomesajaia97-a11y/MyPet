import type { Metadata } from "next";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "./providers";
import { getDictionary } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { getAllOverrides } from "@/lib/i18n/textStore";
import { applyOverrides } from "@/lib/i18n/overrides";
import { SITE_URL } from "@/lib/siteUrl";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_KEYWORDS } from "@/lib/seo/keywords";
import { SITE_NAME, SITE_TITLE_TEMPLATE, siteVerification } from "@/lib/seo/metadata";
import { graph, organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonLd";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  const verification = siteVerification();
  return {
    metadataBase: new URL(SITE_URL),
    // Only present once a token is configured — see siteVerification().
    ...(verification ? { verification } : {}),
    title: {
      default: t.common.metaTitle,
      // Child pages set only their own title; this appends the brand.
      template: SITE_TITLE_TEMPLATE,
    },
    description: t.common.metaDescription,
    // Site-wide head terms. Section pages replace this with their own intent
    // set (see lib/seo/keywords.ts) rather than inheriting the broad list.
    keywords: SITE_KEYWORDS,
    applicationName: SITE_NAME,
    category: "pets",
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    // No `alternates.canonical` here on purpose. Nested metadata is merged
    // shallowly, so a root canonical is INHERITED verbatim by every page that
    // doesn't set its own — which had /about, /contact, /terms and /privacy all
    // declaring themselves to be the homepage. Each page states its own via
    // pageMetadata(); a page with none simply emits no canonical, which is the
    // safe default.
    // Phone numbers are rendered as real tel: links already; leaving detection
    // on lets Safari rewrite listing text into its own broken links.
    formatDetection: { telephone: false, address: false, email: false },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: SITE_URL,
      title: t.common.metaTitle,
      description: t.common.metaDescription,
      locale: locale === "ka" ? "ka_GE" : "en_US",
      alternateLocale: locale === "ka" ? "en_US" : "ka_GE",
      // og:image comes from app/opengraph-image.tsx (file convention).
    },
    twitter: {
      // See lib/seo/metadata.ts — no handle is claimed, so none is named.
      card: "summary_large_image",
      title: t.common.metaTitle,
      description: t.common.metaDescription,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale();
  // Read once here and hand down: the layout renders on every request anyway,
  // and client components need the overrides for both languages so switching
  // language does not briefly show the original wording.
  const overrides = await getAllOverrides();
  const t = applyOverrides(getDictionary(locale), overrides[locale]);
  return (
    <html lang={locale} className={GeistSans.variable}>
      <body>
        {/* Site-level entities (Organization + WebSite with a SearchAction).
            Emitted once from the root so every page inherits them and page-level
            nodes can reference them by @id. */}
        <JsonLd
          data={graph(
            organizationJsonLd(t.common.metaDescription),
            websiteJsonLd(locale, t.common.metaTitle, t.common.metaDescription),
          )}
        />
        <Providers initialLocale={locale} overrides={overrides}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-[#0E4A5C] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
          >
            {t.common.skipToContent}
          </a>
          <Navbar />
          <main id="main" className="min-h-[calc(100vh-6rem)]">{children}</main>
          <Footer />
        </Providers>
        {/* Web Insights analytics — loads after hydration (afterInteractive). */}
        <Script
          src="https://webinsights.vercel.app/js/script.js"
          data-site-id="lK3fT5Ml5zqa"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
