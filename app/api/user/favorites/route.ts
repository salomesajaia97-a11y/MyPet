import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId, Types } from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import UserModel from "@/lib/models/User";
import "@/lib/models/Listing"; // ensure the Listing model is registered for populate

// GET: the current user's favorites. `?ids=1` returns just the id list (used by
// the client store); otherwise returns the populated listings (favorites page).
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const idsOnly = new URL(req.url).searchParams.get("ids") === "1";

  if (idsOnly) {
    const user = await UserModel.findById(session.user.id).select("favorites").lean();
    const ids = (user?.favorites ?? []).map((f: Types.ObjectId) => f.toString());
    return NextResponse.json({ favorites: ids });
  }

  const user = await UserModel.findById(session.user.id)
    .select("favorites")
    .populate({ path: "favorites", options: { sort: { createdAt: -1 } } })
    .lean();
  return NextResponse.json({ listings: user?.favorites ?? [] });
}

// POST { listingId }: toggle a listing in the user's favorites.
// Returns { favorited: boolean } — the new state.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let listingId: unknown;
  try {
    ({ listingId } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof listingId !== "string" || !isValidObjectId(listingId)) {
    return NextResponse.json({ error: "Valid listingId required" }, { status: 400 });
  }

  await connectDB();
  const user = await UserModel.findById(session.user.id).select("favorites");
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const already = user.favorites.some((f: Types.ObjectId) => f.toString() === listingId);
  if (already) {
    user.set(
      "favorites",
      user.favorites.filter((f: Types.ObjectId) => f.toString() !== listingId)
    );
  } else {
    user.favorites.push(new Types.ObjectId(listingId));
  }
  await user.save();

  return NextResponse.json({ favorited: !already });
}
