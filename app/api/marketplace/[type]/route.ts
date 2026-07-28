import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ListingModel from "@/lib/models/Listing";
import { getListings } from "@/lib/marketplace/queries";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rateLimit";
import { handleMutationError } from "@/lib/api/errors";

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
    const { searchParams } = new URL(req.url);
    const listings = await getListings(
      type,
      Object.fromEntries(searchParams.entries())
    );
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

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(`listing-create:${session.user.id}`, 10, 60 * 60_000);
  if (limited) return limited;

  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    // Never trust client-supplied ownership or timestamps.
    delete body._id;
    delete body.userId;
    delete body.createdAt;
    delete body.updatedAt;
    // VIP promotion is granted only via payment or an admin; `isResolved`
    // defaults to false on the model, and `views` is owned by the view route.
    // A new listing must never set any of these from client input — it is
    // created as non-VIP with a zero view count. `vipTier`/`vipRank` are
    // stripped alongside `isVip` because placement sorts on the rank.
    delete body.isVip;
    delete body.vipUntil;
    delete body.vipTier;
    delete body.vipRank;
    delete body.isResolved;
    delete body.views;

    // `price` is optional on the schema because adoption and lost-found posts
    // have none, so the per-type requirement has to be enforced here. Without
    // it a buy-sell listing can be created with no price, and every card that
    // formats one throws while rendering the public feed.
    if (type === "buy-sell" && !Number.isFinite(body.price as number)) {
      return NextResponse.json({ error: "A numeric price is required" }, { status: 400 });
    }

    await connectDB();
    // Attribute the listing to the logged-in user so it surfaces under
    // "My Listings".
    const listing = await ListingModel.create({
      ...body,
      type,
      userId: session.user.id,
    });
    return NextResponse.json({ listing }, { status: 201 });
  } catch (err) {
    return handleMutationError(err, "marketplace/[type] POST");
  }
}
