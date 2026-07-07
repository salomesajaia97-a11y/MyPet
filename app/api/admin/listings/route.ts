import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import ListingModel from "@/lib/models/Listing";
import UserModel from "@/lib/models/User";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "admin") return null;
  return session;
}

const VALID_TYPES = ["buy-sell", "adoption", "mating", "lost-found"];
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Every listing, newest first, for the admin listings manager.
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "";
  const q = (searchParams.get("q") ?? "").trim();

  const filter: Record<string, unknown> = {};
  if (VALID_TYPES.includes(type)) filter.type = type;
  if (q) filter.breed = { $regex: escapeRegex(q), $options: "i" };

  await connectDB();
  const listings = await ListingModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .lean<
      {
        _id: { toString(): string };
        type: string;
        species?: string;
        breed?: string;
        price?: number;
        currency?: string;
        images?: string[];
        location?: string;
        status?: string;
        isResolved?: boolean;
        isFeatured?: boolean;
        userId?: { toString(): string };
        createdAt: Date;
      }[]
    >();

  // Resolve owner display names in one query.
  const ownerIds = [...new Set(listings.map((l) => l.userId?.toString()).filter(Boolean))];
  const owners = await UserModel.find({ _id: { $in: ownerIds } })
    .select("name email")
    .lean<{ _id: { toString(): string }; name?: string; email?: string }[]>();
  const ownerMap = new Map(owners.map((u) => [u._id.toString(), u.name || u.email || ""]));

  const items = listings.map((l) => ({
    _id: l._id.toString(),
    type: l.type,
    breed: l.breed ?? "",
    species: l.species ?? "",
    price: typeof l.price === "number" ? l.price : null,
    currency: l.currency ?? "GEL",
    image: l.images?.[0] ?? "",
    location: (l.location ?? "").split(",")[0].trim(),
    status: l.status ?? "",
    isResolved: !!l.isResolved,
    isFeatured: !!l.isFeatured,
    owner: l.userId ? ownerMap.get(l.userId.toString()) ?? "—" : "—",
    createdAt: l.createdAt,
  }));

  return NextResponse.json({ listings: items });
}
