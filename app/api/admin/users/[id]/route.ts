import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import UserModel from "@/lib/models/User";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "admin") return null;
  return session;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if ("role" in body && body.role !== "user" && body.role !== "admin") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  await connectDB();
  const target = await UserModel.findById(id);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Never let the last admin be demoted — that would lock everyone out.
  if ("role" in body && target.role === "admin" && body.role !== "admin") {
    const adminCount = await UserModel.countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Cannot demote the last admin" }, { status: 409 });
    }
  }

  if (typeof body.name === "string") target.name = body.name;
  if (body.role === "user" || body.role === "admin") target.role = body.role;
  await target.save();

  const { passwordHash: _omit, ...safe } = target.toObject();
  void _omit;
  return NextResponse.json(safe);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await connectDB();
  const user = await UserModel.findById(id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Block deleting the last admin so the app can't be left with no admins.
  if (user.role === "admin") {
    const adminCount = await UserModel.countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Cannot delete the last admin" }, { status: 409 });
    }
  }

  await user.deleteOne();
  return NextResponse.json({ success: true });
}
