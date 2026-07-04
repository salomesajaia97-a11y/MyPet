import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ListingModel from "@/lib/models/Listing";
import { speciesToSlug, locationMatchTerms } from "@/lib/marketplace/filters";
import { auth } from "@/auth";

/** Escape user text before using it inside a RegExp. */
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const VALID_TYPES = ["buy-sell", "adoption", "mating", "lost-found"];

export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/marketplace/[type]">
) {
  const { type } = await ctx.params;

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid listing type" }, { status: 400 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const filter: Record<string, unknown> = { type };

    // Species arrives in Georgian ("ძაღლი"); the DB stores English slugs.
    const speciesParam = searchParams.get("species");
    if (speciesParam) {
      const slug = speciesToSlug(speciesParam) || speciesParam;
      filter.species = slug;
    }
    if (searchParams.get("pedigree")) filter.pedigree = searchParams.get("pedigree");
    if (searchParams.get("status")) filter.status = searchParams.get("status");
    if (searchParams.get("sex")) filter.sex = searchParams.get("sex");

    // Numeric price range (buy-sell / mating). Ignore non-numeric input.
    const minPrice = Number(searchParams.get("minPrice"));
    const maxPrice = Number(searchParams.get("maxPrice"));
    const price: Record<string, number> = {};
    if (searchParams.get("minPrice") && !Number.isNaN(minPrice)) price.$gte = minPrice;
    if (searchParams.get("maxPrice") && !Number.isNaN(maxPrice)) price.$lte = maxPrice;
    if (Object.keys(price).length) filter.price = price;

    // City matches the free-text `location` field — either the city itself or
    // any of its known districts (case-insensitive substring).
    const city = searchParams.get("city");
    if (city) {
      const pattern = locationMatchTerms(city).map(escapeRegex).join("|");
      filter.location = { $regex: pattern, $options: "i" };
    }

    // Free-text query matches the breed.
    const q = searchParams.get("q");
    if (q) filter.breed = { $regex: escapeRegex(q), $options: "i" };

    const listings = await ListingModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ listings });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/marketplace/[type]">
) {
  const { type } = await ctx.params;

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid listing type" }, { status: 400 });
  }

  try {
    const session = await auth();
    const body = await req.json();
    await connectDB();
    // Attribute the listing to the logged-in user so it surfaces under
    // "My Listings". `userId` from the client body is ignored in favour of
    // the session id.
    const listing = await ListingModel.create({
      ...body,
      type,
      userId: session?.user?.id ?? undefined,
    });
    return NextResponse.json({ listing }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
