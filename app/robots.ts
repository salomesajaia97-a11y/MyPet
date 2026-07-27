import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * Private / auth-gated areas and API endpoints shouldn't be crawled. Beyond
 * those, the write and edit flows plus the payment return page are dead ends
 * for a crawler, so crawl budget lands on real listings instead.
 *
 * Free-text search results (`?q=`) are deliberately NOT blocked here — they
 * carry `robots: noindex` from the page itself, and a disallow would stop
 * Google from ever reading that directive.
 */
const DISALLOW = [
  "/admin",
  "/profile",
  "/api",
  "/login",
  "/register",
  "/payment",
  "/listings/new",
  "/services/new",
  "/listings/*/edit",
  "/services/*/*/edit",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
      // Image crawlers earn their keep here: listing photos are the reason
      // people click through from Google Images.
      {
        userAgent: "Googlebot-Image",
        allow: "/",
        disallow: ["/admin", "/profile", "/api"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
