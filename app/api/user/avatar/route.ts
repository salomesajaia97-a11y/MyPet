import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UserModel from "@/lib/models/User";
import { auth } from "@/auth";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await req.json() as { url: string };
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  await connectDB();
  await UserModel.findOneAndUpdate(
    { email: session.user.email },
    { image: url }
  );

  return NextResponse.json({ ok: true });
}
