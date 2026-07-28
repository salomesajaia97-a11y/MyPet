import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import ListingModel from "@/lib/models/Listing";
import ListingViewModel from "@/lib/models/ListingView";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { tbilisiDayStamp, viewDedupeKey } from "@/lib/marketplace/views";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Counts one detail-page view. Called once on mount by <ViewCounter>, so pages
 * fetched by crawlers that do not run JavaScript never land here.
 *
 * The count is idempotent per (listing, visitor, Tbilisi day): the unique index
 * on ListingView.key decides. Whoever wins the insert increments; a duplicate
 * just reads the current total back. Always responds with the count so the
 * client can show the live number either way.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ip = clientIp(req);
  // Generous: a person genuinely browsing opens listings quickly. This only
  // exists to stop a script hammering the endpoint.
  const limited = rateLimit(`listing-view:${ip}`, 120, 60_000);
  if (limited) return limited;

  // Without a secret the digest would be predictable, and a fabricated key
  // could suppress someone else's view. Fail closed and skip counting.
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const key = viewDedupeKey({
    listingId: id,
    ip,
    userAgent: req.headers.get("user-agent") ?? "unknown",
    day: tbilisiDayStamp(),
    secret,
  });

  try {
    await connectDB();

    let counted = true;
    try {
      await ListingViewModel.create({ key, expiresAt: new Date(Date.now() + DAY_MS) });
    } catch (err) {
      // E11000 = this visitor already counted for this listing today.
      if ((err as { code?: number }).code !== 11000) throw err;
      counted = false;
    }

    const listing = counted
      ? await ListingModel.findByIdAndUpdate(
          id,
          { $inc: { views: 1 } },
          { new: true, projection: { views: 1 } }
        ).lean<{ views?: number } | null>()
      : await ListingModel.findById(id, { views: 1 }).lean<{ views?: number } | null>();

    if (!listing) {
      // The dedupe row is written before we know the listing exists (checking
      // first would cost an extra query on every real view). Drop it again so a
      // bogus id cannot seed the collection with rows nothing will ever match.
      if (counted) await ListingViewModel.deleteOne({ key });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ views: listing.views ?? 0, counted });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
