import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import UploadModel from "@/lib/models/Upload";
import cloudinary from "@/lib/cloudinary";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "admin") return null;
  return session;
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await connectDB();
  const upload = await UploadModel.findById(id);
  if (!upload) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await cloudinary.uploader.destroy(upload.publicId);
  await upload.deleteOne();

  return NextResponse.json({ success: true });
}
