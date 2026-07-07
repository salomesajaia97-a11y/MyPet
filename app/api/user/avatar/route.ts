import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UserModel from "@/lib/models/User";
import { auth } from "@/auth";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url : "";
  // An empty string clears the avatar. Any non-empty value must be one of our
  // own Cloudinary uploads — reject anything else so an arbitrary/`javascript:`
  // URL can't be stored and later rendered.
  if (url !== "") {
    let isCloudinary = false;
    try {
      const parsed = new URL(url);
      isCloudinary =
        parsed.protocol === "https:" && parsed.hostname === "res.cloudinary.com";
    } catch {
      isCloudinary = false;
    }
    if (!isCloudinary) {
      return NextResponse.json({ error: "invalid image url" }, { status: 400 });
    }
  }

  try {
    await connectDB();
    const updated = await UserModel.findOneAndUpdate(
      { email: session.user.email },
      { image: url }
    );
    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update avatar" }, { status: 500 });
  }
}
