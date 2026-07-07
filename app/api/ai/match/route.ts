import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import ListingModel from "@/lib/models/Listing";
import { aiEnabled, matchLostPet, type MatchCandidate } from "@/lib/ai";
import { rateLimit } from "@/lib/rateLimit";

const MAX_CANDIDATES = 12;
const ALLOWED_MEDIA = ["image/jpeg", "image/png", "image/webp"] as const;
type Media = (typeof ALLOWED_MEDIA)[number];

export async function POST(req: NextRequest) {
  if (!aiEnabled()) {
    return NextResponse.json(
      { error: "AI matcher is not configured (set ANTHROPIC_API_KEY)." },
      { status: 503 }
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Vision calls are the priciest — keep the per-user budget tight.
  const limited = rateLimit(`ai-match:${session.user.id}`, 10, 10 * 60_000);
  if (limited) return limited;

  let image: unknown, mediaType: unknown;
  try {
    ({ image, mediaType } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof image !== "string" || image.length < 100) {
    return NextResponse.json({ error: "A base64 image is required" }, { status: 400 });
  }
  if (typeof mediaType !== "string" || !ALLOWED_MEDIA.includes(mediaType as Media)) {
    return NextResponse.json({ error: "Image must be JPEG, PNG, or WebP" }, { status: 400 });
  }
  // ~5MB base64 ceiling.
  if (image.length > 7_000_000) {
    return NextResponse.json({ error: "Image too large (max ~5MB)" }, { status: 413 });
  }

  await connectDB();
  // Unresolved lost/found listings that have a photo to compare against.
  const listings = await ListingModel.find({
    type: "lost-found",
    isResolved: { $ne: true },
    images: { $exists: true, $ne: [] },
  })
    .sort({ createdAt: -1 })
    .limit(MAX_CANDIDATES)
    .lean<
      {
        _id: { toString(): string };
        breed?: string;
        status?: string;
        neighborhood?: string;
        location?: string;
        images?: string[];
        contactPhone?: string;
      }[]
    >();

  if (listings.length === 0) {
    return NextResponse.json({ matches: [] });
  }

  const candidates: MatchCandidate[] = listings.map((l) => ({
    id: l._id.toString(),
    imageUrl: l.images![0],
  }));

  let results;
  try {
    results = await matchLostPet(image, mediaType as Media, candidates);
  } catch (err) {
    console.error("[ai-match]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "AI matching failed" }, { status: 502 });
  }
  if (!results) {
    return NextResponse.json({ error: "Could not analyze the image" }, { status: 422 });
  }

  // Join matches back to listing details for display.
  const byId = new Map(listings.map((l) => [l._id.toString(), l]));
  const matches = results
    .map((m) => {
      const l = byId.get(m.id);
      if (!l) return null;
      return {
        id: m.id,
        confidence: m.confidence,
        reason: m.reason,
        breed: l.breed ?? "",
        status: l.status ?? "",
        location: (l.location ?? l.neighborhood ?? "").split(",")[0].trim(),
        image: l.images?.[0] ?? "",
      };
    })
    .filter(Boolean);

  return NextResponse.json({ matches });
}
