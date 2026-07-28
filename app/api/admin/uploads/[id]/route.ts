import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import UploadModel from "@/lib/models/Upload";
import cloudinary from "@/lib/cloudinary";
import { logAdminAction, requireAdmin } from "@/lib/admin/guard";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAdmin();
  if (!actor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await connectDB();
    const upload = await UploadModel.findById(id);
    if (!upload) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await cloudinary.uploader.destroy(upload.publicId);
    await upload.deleteOne();

    await logAdminAction(actor, "upload.delete", {
      type: "upload",
      id,
      summary: `Deleted image ${upload.publicId} from Cloudinary`,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
