import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import ThreadModel from "@/lib/models/Thread";
import MessageModel from "@/lib/models/Message";
import ListingModel from "@/lib/models/Listing";
import UserModel from "@/lib/models/User";
import { rateLimit } from "@/lib/rateLimit";
import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";

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

  const t = getDictionary(await getServerLocale());

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
        listingTitle: listing.breed ?? t.misc.listing,
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

  const t = getDictionary(await getServerLocale());

  await connectDB();
  const threads = await ThreadModel.find({ $or: [{ buyerId: me }, { ownerId: me }] })
    .sort({ lastMessageAt: -1 })
    .limit(100)
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

  // Unread counts for ALL threads in one query (was N+1 countDocuments). Pull
  // the timestamps of messages from the other party, then bucket per thread and
  // count those newer than my last read.
  const inbound = await MessageModel.find({
    threadId: { $in: threads.map((t) => t._id) },
    senderId: { $ne: me },
  })
    .select("threadId createdAt")
    .lean<{ threadId: { toString(): string }; createdAt: Date }[]>();
  const stampsByThread = new Map<string, Date[]>();
  for (const m of inbound) {
    const k = m.threadId.toString();
    const arr = stampsByThread.get(k);
    if (arr) arr.push(m.createdAt);
    else stampsByThread.set(k, [m.createdAt]);
  }

  const items = threads.map((th) => {
    const iAmBuyer = th.buyerId.toString() === me;
    const myReadAt = iAmBuyer ? th.buyerReadAt : th.ownerReadAt;
    const otherId = iAmBuyer ? th.ownerId.toString() : th.buyerId.toString();
    const other = userMap.get(otherId);
    const stamps = stampsByThread.get(th._id.toString()) ?? [];
    const unread = myReadAt
      ? stamps.filter((d) => d > myReadAt).length
      : stamps.length;
    return {
      _id: th._id.toString(),
      listingId: th.listingId.toString(),
      listingTitle: th.listingTitle,
      lastMessageBody: th.lastMessageBody,
      lastMessageAt: th.lastMessageAt,
      otherName: other?.name || other?.email?.split("@")[0] || t.misc.user,
      otherImage: other?.image ?? null,
      unread,
    };
  });

  return NextResponse.json({ threads: items });
}
