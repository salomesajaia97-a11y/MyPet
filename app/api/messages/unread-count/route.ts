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
        _id: unknown;
        buyerId: { toString(): string };
        ownerId: { toString(): string };
        buyerReadAt: Date | null;
        ownerReadAt: Date | null;
      }[]
    >();

  // Count each thread's unread messages concurrently rather than serially.
  const perThread = await Promise.all(
    threads.map((t) => {
      const iAmBuyer = t.buyerId.toString() === me;
      const myReadAt = iAmBuyer ? t.buyerReadAt : t.ownerReadAt;
      return MessageModel.countDocuments({
        threadId: t._id,
        senderId: { $ne: me },
        ...(myReadAt ? { createdAt: { $gt: myReadAt } } : {}),
      });
    })
  );
  const total = perThread.reduce((sum, n) => sum + n, 0);

  return NextResponse.json({ count: total });
}
