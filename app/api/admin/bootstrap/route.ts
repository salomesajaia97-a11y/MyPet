import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UserModel from "@/lib/models/User";

const ADMIN_EMAIL = "salome.sajaia97@gmail.com";

// One-time bootstrap: sets ADMIN_EMAIL as admin.
// Protected by BOOTSTRAP_SECRET env var.
// Remove this route after first use.
export async function POST(req: NextRequest) {
  const secret = process.env.BOOTSTRAP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "BOOTSTRAP_SECRET not configured" }, { status: 500 });
  }

  const { secret: provided } = await req.json();
  if (provided !== secret) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  await connectDB();

  const adminAlreadyExists = await UserModel.exists({ role: "admin" });
  if (adminAlreadyExists) {
    return NextResponse.json({ error: "An admin already exists" }, { status: 409 });
  }

  const user = await UserModel.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    { $set: { role: "admin" } },
    { new: true, select: "-passwordHash" }
  );

  if (!user) {
    return NextResponse.json(
      { error: `${ADMIN_EMAIL} not found — register the account first` },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, user });
}
