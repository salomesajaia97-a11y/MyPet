import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import ThreadModel from "@/lib/models/Thread";
import MessageModel from "@/lib/models/Message";

// Total unread messages across all of my threads — powers the navbar dot.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = session.user.id;

  await connectDB();
  const threads = await ThreadModel.find({ $or: [{ buyerId: me }, { ownerId: me }] })
    .select("buyerId ownerId buyerReadAt ownerReadAt")
    .lean<
      {
        _id: { toString(): string };
        buyerId: { toString(): string };
        ownerId: { toString(): string };
        buyerReadAt: Date | null;
        ownerReadAt: Date | null;
      }[]
    >();

  // One query for all inbound messages (was N+1 countDocuments), bucketed per
  // thread, then counted against each thread's last-read timestamp in memory.
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

  const total = threads.reduce((sum, t) => {
    const iAmBuyer = t.buyerId.toString() === me;
    const myReadAt = iAmBuyer ? t.buyerReadAt : t.ownerReadAt;
    const stamps = stampsByThread.get(t._id.toString()) ?? [];
    return sum + (myReadAt ? stamps.filter((d) => d > myReadAt).length : stamps.length);
  }, 0);

  return NextResponse.json({ count: total });
}
