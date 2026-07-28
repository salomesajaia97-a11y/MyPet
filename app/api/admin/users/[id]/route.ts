import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import UserModel from "@/lib/models/User";
import { deleteUserCascade } from "@/lib/services/deleteUser";
import { logAdminAction, requireAdmin } from "@/lib/admin/guard";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAdmin();
  if (!actor) {
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

  const previousRole = target.role;
  if (typeof body.name === "string") target.name = body.name;
  if (body.role === "user" || body.role === "admin") target.role = body.role;
  await target.save();

  await logAdminAction(actor, "user.update", {
    type: "user",
    id,
    summary:
      target.role !== previousRole
        ? `Changed ${target.email} from ${previousRole} to ${target.role}`
        : `Edited ${target.email}`,
  });

  const { passwordHash: _omit, ...safe } = target.toObject();
  void _omit;
  return NextResponse.json(safe);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAdmin();
  if (!actor) {
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

  // Takes their listings, reviews, conversations and pending submissions with
  // them; approved businesses survive without an owner, payments are kept.
  const email = user.email;
  await deleteUserCascade(id);
  await logAdminAction(actor, "user.delete", {
    type: "user",
    id,
    summary: `Deleted ${email} and their listings, reviews and conversations`,
  });
  return NextResponse.json({ success: true });
}
