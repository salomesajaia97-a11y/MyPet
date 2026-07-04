import { connectDB } from "@/lib/db";
import BusinessModel from "@/lib/models/Business";
import type { BusinessData } from "@/lib/data/businesses";

export async function fetchDBBusinesses(category: string): Promise<BusinessData[]> {
  try {
    await connectDB();
    const docs = await BusinessModel.find({ category, status: "approved" })
      .sort({ createdAt: -1 })
      .lean<{
        _id: { toString(): string };
        name: string;
        category: "vet-clinics" | "pet-hotels" | "pet-shops" | "pet-friendly";
        description: string;
        address: string;
        neighborhood?: string;
        city: string;
        phone: string;
        website?: string;
        images?: string[];
        tags?: string[];
        is24h?: boolean;
        hasEmergency?: boolean;
        aggregateRating?: number;
        googleRatingCount?: number;
        pricePerNight?: number;
        indoorAllowed?: boolean;
        source?: string;
        lat?: number;
        lng?: number;
      }[]>();

    // Dedupe: the same real place can arrive both as a curated ("seed") row and
    // an OSM-scraped one, and OSM itself yields node/way pairs. Curated rows
    // (richer: photos, ratings) always win; then collapse same name+city.
    const norm = (s?: string) =>
      (s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
    const seedNames = new Set(
      docs.filter((d) => d.source === "seed").map((d) => norm(d.name))
    );
    const seen = new Set<string>();
    const unique = docs.filter((d) => {
      if (d.source !== "seed" && seedNames.has(norm(d.name))) return false;
      const key = `${norm(d.name)}|${norm(d.city)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.map((biz) => ({
      _id: biz._id.toString(),
      name: biz.name,
      nameKa: biz.name,
      category: biz.category,
      description: biz.description,
      address: biz.address,
      neighborhood: biz.neighborhood ?? biz.city,
      city: biz.city,
      phone: biz.phone,
      website: biz.website,
      image: biz.images?.[0] ?? "",
      tags: biz.tags ?? [],
      is24h: biz.is24h ?? false,
      hasEmergency: biz.hasEmergency ?? false,
      rating: biz.aggregateRating ?? 0,
      reviewCount: biz.googleRatingCount ?? 0,
      pricePerNight: biz.pricePerNight,
      indoorAllowed: biz.indoorAllowed,
      lat: biz.lat,
      lng: biz.lng,
    }));
  } catch {
    return [];
  }
}
