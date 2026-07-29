import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import ThreadModel from "@/lib/models/Thread";
import MessageModel from "@/lib/models/Message";
import ListingModel from "@/lib/models/Listing";
import { rateLimit } from "@/lib/rateLimit";

/** Most recent messages returned per thread. Older ones stay in the database. */
const MAX_MESSAGES = 200;

async function loadParticipantThread(id: string, me: string) {
  const thread = await ThreadModel.findById(id);
  if (!thread) return { error: "notfound" as const };
  const isParticipant =
    thread.buyerId.toString() === me || thread.ownerId.toString() === me;
  if (!isParticipant) return { error: "forbidden" as const };
  return { thread };
}

// Messages in a thread (ascending). Marks the thread read for the caller.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = session.user.id;

  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await connectDB();
  const { thread, error } = await loadParticipantThread(id, me);
  if (error === "notfound") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (error === "forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const t = thread!;
  const iAmBuyer = t.buyerId.toString() === me;

  // Mark read for the caller's side.
  if (iAmBuyer) t.buyerReadAt = new Date();
  else t.ownerReadAt = new Date();
  await t.save();

  // Newest MAX_MESSAGES only, flipped back into reading order. The chat page
  // re-fetches this every five seconds, so an unbounded query meant a long
  // thread re-sent its whole history twelve times a minute. One extra row is
  // read purely to tell the client whether anything was left out.
  const page = await MessageModel.find({ threadId: t._id })
    .sort({ createdAt: -1 })
    .limit(MAX_MESSAGES + 1)
    .lean<{ _id: { toString(): string }; senderId: { toString(): string }; body: string; createdAt: Date }[]>();
  const truncated = page.length > MAX_MESSAGES;
  const messages = page.slice(0, MAX_MESSAGES).reverse();

  // A thread outlives its listing on purpose (the title is snapshotted), but
  // the header still offered "View listing" straight into a 404. Tell the
  // client whether that link leads anywhere.
  const listingExists = !!(await ListingModel.exists({ _id: t.listingId }));

  return NextResponse.json({
    thread: {
      _id: t._id.toString(),
      listingId: t.listingId.toString(),
      listingTitle: t.listingTitle,
      listingExists,
    },
    meId: me,
    truncated,
    messages: messages.map((m) => ({
      _id: m._id.toString(),
      senderId: m.senderId.toString(),
      body: m.body,
      createdAt: m.createdAt,
      mine: m.senderId.toString() === me,
    })),
  });
}

// Reply to a thread.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = session.user.id;

  const limited = rateLimit(`messages:${me}`, 20, 10 * 60_000);
  if (limited) return limited;

  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let rawBody: unknown;
  try {
    ({ body: rawBody } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const body = typeof rawBody === "string" ? rawBody.trim() : "";
  if (body.length < 1 || body.length > 2000) {
    return NextResponse.json({ error: "Message must be 1–2000 characters" }, { status: 400 });
  }

  await connectDB();
  const { thread, error } = await loadParticipantThread(id, me);
  if (error === "notfound") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (error === "forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const t = thread!;
  await MessageModel.create({ threadId: t._id, senderId: me, body });

  const now = new Date();
  t.lastMessageAt = now;
  t.lastMessageBody = body;
  if (t.buyerId.toString() === me) t.buyerReadAt = now;
  else t.ownerReadAt = now;
  await t.save();

  return NextResponse.json({ success: true }, { status: 201 });
}
