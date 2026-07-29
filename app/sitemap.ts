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
  { path: "/vip", priority: 0.5, changeFrequency: "monthly" },
  // Answers real questions in plain text and carries FAQPage structured data,
  // so it earns a higher priority than the other static pages.
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about", priority: 0.4, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.4, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.3, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "monthly" },
];

// Re-generate at most once an hour; a stale sitemap is fine and this avoids a
// DB hit on every crawler request.
export const revalidate = 3600;

/** Google ignores anything past 50k URLs / 50 MB in one sitemap file. */
const MAX_PER_TYPE = 20000;

// Next serializes this route's return value into XML by raw interpolation
// (`<loc>${url}</loc>`), so nothing here is escaped for us. A single `&` from a
// CDN query string is enough to break the whole document with
// "EntityRef: expecting ';'". Every URL goes through xmlSafeUrl() below.
const XML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

const escapeXml = (value: string) => value.replace(/[&<>"']/g, (c) => XML_ENTITIES[c]);

const XML_TEXT: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

// Some image URLs were scraped from pages that had already HTML-escaped them,
// so they sit in the DB as `...?a=1&amp;b=2`. Escaping those again yields
// `&amp;amp;` and hands Google a URL that 404s, so decode to a plain string
// first — repeatedly, since a few are double-encoded at the source.
function decodeXmlEntities(value: string): string {
  let previous: string;
  let out = value;
  do {
    previous = out;
    out = out.replace(/&(amp|lt|gt|quot|apos);/g, (_, name: string) => XML_TEXT[name]);
  } while (out !== previous);
  return out;
}

/**
 * Percent-encode the URL (stored image paths can contain spaces and other
 * characters that are illegal in a `<loc>`), then XML-escape it exactly once.
 * Returns null for anything that isn't a parseable absolute URL so the caller
 * can drop it instead of emitting a broken entry.
 */
function xmlSafeUrl(raw: string): string | null {
  try {
    return escapeXml(new URL(decodeXmlEntities(raw)).href);
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC.map((r) => ({
    url: xmlSafeUrl(`${SITE_URL}${r.path}`) ?? `${SITE_URL}${r.path}`,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Append real detail pages so crawlers index actual content, not just section
  // pages. Best-effort: if the DB is unreachable, fall back to static only.
  try {
    await connectDB();
    const [listings, businesses] = await Promise.all([
      // `images` rides along so each entry can carry an image sitemap tag —
      // pet photos are what earn the click in Google Images.
      ListingModel.find({}, "images updatedAt createdAt")
        .sort({ createdAt: -1 })
        .limit(MAX_PER_TYPE)
        .lean<
          {
            _id: { toString(): string };
            images?: string[];
            updatedAt?: Date;
            createdAt?: Date;
          }[]
        >(),
      BusinessModel.find({ status: "approved" }, "category images updatedAt createdAt")
        .sort({ createdAt: -1 })
        .limit(MAX_PER_TYPE)
        .lean<
          {
            _id: { toString(): string };
            category: string;
            images?: string[];
            updatedAt?: Date;
            createdAt?: Date;
          }[]
        >(),
    ]);

    // Only absolute URLs are valid in an image sitemap; a listing can hold a
    // relative or blank path, so those are filtered out rather than emitted.
    const httpImages = (images?: string[]) =>
      (images ?? [])
        .filter((src) => /^https?:\/\//.test(src))
        .map(xmlSafeUrl)
        .filter((src): src is string => src !== null)
        .slice(0, 5);

    const listingEntries: MetadataRoute.Sitemap = listings.map((l) => {
      const images = httpImages(l.images);
      return {
        url: `${SITE_URL}/listings/${encodeURIComponent(l._id.toString())}`,
        lastModified: l.updatedAt ?? l.createdAt,
        changeFrequency: "weekly",
        priority: 0.6,
        ...(images.length ? { images } : {}),
      };
    });

    const businessEntries: MetadataRoute.Sitemap = businesses.map((b) => {
      const images = httpImages(b.images);
      return {
        url: `${SITE_URL}/services/${encodeURIComponent(b.category)}/${encodeURIComponent(b._id.toString())}`,
        lastModified: b.updatedAt ?? b.createdAt,
        changeFrequency: "weekly",
        // Business pages change rarely but are the durable, link-worthy pages
        // on the site — ranked above an individual classified.
        priority: 0.7,
        ...(images.length ? { images } : {}),
      };
    });

    return [...staticEntries, ...listingEntries, ...businessEntries];
  } catch {
    return staticEntries;
  }
}
