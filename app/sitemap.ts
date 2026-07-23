import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";
import { connectDB } from "@/lib/db";
import ListingModel from "@/lib/models/Listing";
import BusinessModel from "@/lib/models/Business";

// Static, always-indexable routes. Auth-gated areas (/admin, /profile) and
// write flows are excluded (also blocked in robots.ts).
const STATIC: Array<{ path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }> = [
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

// Re-generate at most once an hour; a stale sitemap is fine and this avoids a
// DB hit on every crawler request.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Append real detail pages so crawlers index actual content, not just section
  // pages. Best-effort: if the DB is unreachable, fall back to static only.
  try {
    await connectDB();
    const [listings, businesses] = await Promise.all([
      ListingModel.find({}, "updatedAt")
        .sort({ createdAt: -1 })
        .limit(5000)
        .lean<{ _id: { toString(): string }; updatedAt?: Date }[]>(),
      BusinessModel.find({ status: "approved" }, "category updatedAt")
        .sort({ createdAt: -1 })
        .limit(5000)
        .lean<{ _id: { toString(): string }; category: string; updatedAt?: Date }[]>(),
    ]);

    const listingEntries: MetadataRoute.Sitemap = listings.map((l) => ({
      url: `${SITE_URL}/listings/${l._id.toString()}`,
      lastModified: l.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    const businessEntries: MetadataRoute.Sitemap = businesses.map((b) => ({
      url: `${SITE_URL}/services/${b.category}/${b._id.toString()}`,
      lastModified: b.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticEntries, ...listingEntries, ...businessEntries];
  } catch {
    return staticEntries;
  }
}
