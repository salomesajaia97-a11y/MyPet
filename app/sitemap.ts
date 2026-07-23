import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";

// Public, indexable routes. Auth-gated areas (/admin, /profile) and write flows
// (/listings/new, /services/new, edit pages) are deliberately excluded — they
// are also blocked in robots.ts. Detail pages are dynamic and could be appended
// here from the DB later; kept static for now to stay build-safe.
export default function sitemap(): MetadataRoute.Sitemap {
  const routes: Array<{ path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }> = [
    { path: "/", priority: 1, changeFrequency: "daily" },
    { path: "/buy-sell", priority: 0.9, changeFrequency: "daily" },
    { path: "/adoption", priority: 0.9, changeFrequency: "daily" },
    { path: "/mating", priority: 0.8, changeFrequency: "weekly" },
    { path: "/lost-found", priority: 0.8, changeFrequency: "daily" },
    { path: "/lost-found/match", priority: 0.5, changeFrequency: "monthly" },
    { path: "/services", priority: 0.8, changeFrequency: "weekly" },
    { path: "/services/vet-clinics", priority: 0.7, changeFrequency: "weekly" },
    { path: "/services/pet-hotels", priority: 0.7, changeFrequency: "weekly" },
    { path: "/services/pet-shops", priority: 0.7, changeFrequency: "weekly" },
    { path: "/services/pet-friendly", priority: 0.7, changeFrequency: "weekly" },
    { path: "/about", priority: 0.4, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.4, changeFrequency: "monthly" },
    { path: "/terms", priority: 0.3, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "monthly" },
  ];

  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
