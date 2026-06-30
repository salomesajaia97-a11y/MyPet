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
      }[]>();

    return docs.map((biz) => ({
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
    }));
  } catch {
    return [];
  }
}
