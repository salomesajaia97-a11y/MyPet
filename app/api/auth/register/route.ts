import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UserModel from "@/lib/models/User";
import { hashPassword } from "@/lib/utils/crypto";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const limited = rateLimit(`register:${clientIp(req)}`, 5, 10 * 60_000);
  if (limited) return limited;

  try {
    const { name, email, password } = await req.json();

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }
    // Basic email shape check — the real validation is uniqueness below.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password min 6 characters" }, { status: 400 });
    }

    await connectDB();

    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await UserModel.create({ name: name.trim(), email: email.toLowerCase(), passwordHash });

    return NextResponse.json(
      { id: user._id.toString(), name: user.name, email: user.email },
      { status: 201 }
    );
  } catch (err) {
    // Two concurrent signups with the same email both pass the findOne check;
    // the unique index rejects the loser with E11000 — treat it as a conflict,
    // not a server error.
    if (err && typeof err === "object" && (err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    console.error("[register]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
