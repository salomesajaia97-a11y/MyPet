import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private / auth-gated areas and API endpoints shouldn't be crawled.
      disallow: ["/admin", "/profile", "/api", "/login", "/register"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
