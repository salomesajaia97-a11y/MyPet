import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import NotificationModel from "@/lib/models/Notification";
import { auth } from "@/auth";

/** Notifications for the current user, newest first, plus the unread count. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const notifications = await NotificationModel.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const unread = await NotificationModel.countDocuments({
      userId: session.user.id,
      read: false,
    });

    return NextResponse.json({ notifications, unread });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Mark notifications read. Body `{ id }` marks one; empty body marks all of
 * the user's notifications read. Scoped to the caller's own notifications so
 * one user can never flip another's.
 */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let id: unknown;
  try {
    ({ id } = await req.json());
  } catch {
    /* no body → mark all */
  }

  // A malformed id would make updateMany throw a CastError (uncaught 500).
  if (id !== undefined && (typeof id !== "string" || !isValidObjectId(id))) {
    return NextResponse.json({ error: "Invalid notification id" }, { status: 400 });
  }

  try {
    await connectDB();
    const filter: Record<string, unknown> = { userId: session.user.id, read: false };
    if (typeof id === "string") filter._id = id;
    await NotificationModel.updateMany(filter, { read: true });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
