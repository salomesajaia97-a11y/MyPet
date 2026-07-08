import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import NotificationModel from "@/lib/models/Notification";
import { auth } from "@/auth";

/** Cheap unread count for the navbar bell badge (polled). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ count: 0 });
  }

  await connectDB();
  const count = await NotificationModel.countDocuments({
    userId: session.user.id,
    read: false,
  });

  return NextResponse.json({ count });
}
