import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ReviewModel from "@/lib/models/Review";
import BusinessModel from "@/lib/models/Business";
import { requireAdmin } from "@/lib/admin/guard";

const LIMIT = 300;

/**
 * Every review on the site, newest first, for the moderation queue.
 *
 * `?state=hidden|visible` narrows to what an admin has already acted on;
 * `?rating=1..5` finds the one-stars, which is what a report is usually about.
 * Text search happens client-side over this page, the same way the businesses
 * queue works — one query, then filter in the browser.
 */
export async function GET(req: NextRequest) {
  const actor = await requireAdmin();
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const state = searchParams.get("state");
  const rating = Number(searchParams.get("rating"));

  const filter: Record<string, unknown> = {};
  if (state === "hidden") filter.hidden = true;
  if (state === "visible") filter.hidden = { $ne: true };
  if (Number.isInteger(rating) && rating >= 1 && rating <= 5) filter.rating = rating;

  try {
    await connectDB();
    const reviews = await ReviewModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(LIMIT)
      .lean<
        {
          _id: { toString(): string };
          businessId: { toString(): string };
          source: string;
          reviewerName: string;
          rating: number;
          text?: string;
          photos?: string[];
          hidden?: boolean;
          ownerReply?: { text?: string } | null;
          createdAt: Date;
        }[]
      >();

    // Resolve business names in one query — the moderator needs to know which
    // business a review is attached to before deciding anything about it.
    const businessIds = [...new Set(reviews.map((r) => r.businessId.toString()))];
    const businesses = await BusinessModel.find({ _id: { $in: businessIds } })
      .select("name category")
      .lean<{ _id: { toString(): string }; name?: string; category?: string }[]>();
    const byId = new Map(businesses.map((b) => [b._id.toString(), b]));

    return NextResponse.json({
      reviews: reviews.map((r) => {
        const business = byId.get(r.businessId.toString());
        return {
          _id: r._id.toString(),
          businessId: r.businessId.toString(),
          businessName: business?.name ?? "—",
          businessCategory: business?.category ?? null,
          source: r.source,
          reviewerName: r.reviewerName,
          rating: r.rating,
          text: r.text ?? "",
          photoCount: r.photos?.length ?? 0,
          hidden: !!r.hidden,
          ownerReply: r.ownerReply?.text ?? null,
          createdAt: r.createdAt.toISOString(),
        };
      }),
      truncated: reviews.length === LIMIT,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
