import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import ThreadModel from "@/lib/models/Thread";
import MessageModel from "@/lib/models/Message";
import ListingModel from "@/lib/models/Listing";
import UserModel from "@/lib/models/User";
import { rateLimit } from "@/lib/rateLimit";

function cleanBody(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const body = input.trim();
  if (body.length < 1 || body.length > 2000) return null;
  return body;
}

// Start (or continue) an inquiry thread on a listing and post the first message.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = session.user.id;

  const limited = rateLimit(`messages:${me}`, 20, 10 * 60_000);
  if (limited) return limited;

  let listingId: unknown, rawBody: unknown;
  try {
    ({ listingId, body: rawBody } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const body = cleanBody(rawBody);
  if (!listingId || !isValidObjectId(listingId)) {
    return NextResponse.json({ error: "Valid listingId required" }, { status: 400 });
  }
  if (!body) {
    return NextResponse.json({ error: "Message must be 1–2000 characters" }, { status: 400 });
  }

  await connectDB();
  const listing = await ListingModel.findById(listingId).select("userId breed type").lean<{
    _id: unknown;
    userId?: { toString(): string };
    breed?: string;
    type?: string;
  }>();
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  const ownerId = listing.userId?.toString();
  if (!ownerId) {
    return NextResponse.json({ error: "This listing has no owner to message" }, { status: 400 });
  }
  if (ownerId === me) {
    return NextResponse.json({ error: "You can't message your own listing" }, { status: 400 });
  }

  const now = new Date();
  const thread = await ThreadModel.findOneAndUpdate(
    { listingId, buyerId: me },
    {
      $setOnInsert: {
        listingId,
        buyerId: me,
        ownerId,
        listingTitle: listing.breed ?? "განცხადება",
      },
      $set: { lastMessageAt: now, lastMessageBody: body, buyerReadAt: now },
    },
    { new: true, upsert: true }
  );

  await MessageModel.create({ threadId: thread._id, senderId: me, body });

  return NextResponse.json({ threadId: thread._id.toString() }, { status: 201 });
}

// Inbox: threads where I'm the buyer or the owner, newest activity first.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = session.user.id;

  await connectDB();
  const threads = await ThreadModel.find({ $or: [{ buyerId: me }, { ownerId: me }] })
    .sort({ lastMessageAt: -1 })
    .lean<
      {
        _id: { toString(): string };
        listingId: { toString(): string };
        listingTitle: string;
        buyerId: { toString(): string };
        ownerId: { toString(): string };
        lastMessageAt: Date;
        lastMessageBody: string;
        buyerReadAt: Date | null;
        ownerReadAt: Date | null;
      }[]
    >();

  // Resolve the "other party" name for each thread in one query.
  const otherIds = threads.map((t) =>
    t.buyerId.toString() === me ? t.ownerId : t.buyerId
  );
  const users = await UserModel.find({ _id: { $in: otherIds } })
    .select("name email image")
    .lean<{ _id: { toString(): string }; name?: string; email?: string; image?: string }[]>();
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  const items = await Promise.all(
    threads.map(async (t) => {
      const iAmBuyer = t.buyerId.toString() === me;
      const myReadAt = iAmBuyer ? t.buyerReadAt : t.ownerReadAt;
      const otherId = iAmBuyer ? t.ownerId.toString() : t.buyerId.toString();
      const other = userMap.get(otherId);
      const unread = await MessageModel.countDocuments({
        threadId: t._id,
        senderId: { $ne: me },
        ...(myReadAt ? { createdAt: { $gt: myReadAt } } : {}),
      });
      return {
        _id: t._id.toString(),
        listingId: t.listingId.toString(),
        listingTitle: t.listingTitle,
        lastMessageBody: t.lastMessageBody,
        lastMessageAt: t.lastMessageAt,
        otherName: other?.name || other?.email?.split("@")[0] || "მომხმარებელი",
        otherImage: other?.image ?? null,
        unread,
      };
    })
  );

  return NextResponse.json({ threads: items });
}
