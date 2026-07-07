import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UserModel from "@/lib/models/User";
import { auth } from "@/auth";

/** Current user's account details, including balance. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await UserModel.findOne({ email: session.user.email })
    .select("name email image balance role")
    .lean();
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

/** Update editable account details (currently the display name). */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const trimmed = typeof body.name === "string" ? body.name.trim() : "";
  if (!trimmed) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  if (trimmed.length > 100) {
    return NextResponse.json({ error: "name too long" }, { status: 400 });
  }

  await connectDB();
  const user = await UserModel.findOneAndUpdate(
    { email: session.user.email },
    { name: trimmed },
    { new: true }
  )
    .select("name email image balance role")
    .lean();

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}
