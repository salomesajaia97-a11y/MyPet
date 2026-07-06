import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ListingModel from "@/lib/models/Listing";
import BusinessModel from "@/lib/models/Business";

export const dynamic = "force-dynamic";

/**
 * Live per-category totals for the homepage. Listings are counted by `type`,
 * services by `category` (approved only). Keys match the homepage category
 * hrefs so the grid can look them up directly.
 */
export async function GET() {
  try {
    await connectDB();

    const [listingGroups, businessGroups] = await Promise.all([
      ListingModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
      BusinessModel.aggregate<{ _id: string; count: number }>([
        { $match: { status: "approved" } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
    ]);

    const counts: Record<string, number> = {};
    for (const g of listingGroups) counts[g._id] = g.count;
    for (const g of businessGroups) counts[g._id] = g.count;

    return NextResponse.json({ counts });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
