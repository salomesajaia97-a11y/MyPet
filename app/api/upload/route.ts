import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { connectDB } from "@/lib/db";
import UploadModel from "@/lib/models/Upload";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rateLimit";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(`upload:${session.user.id}`, 30, 10 * 60_000);
  if (limited) return limited;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, and WebP images are allowed" },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File exceeds 5 MB limit" },
      { status: 413 }
    );
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "mypet",
              resource_type: "image",
              transformation: [{ width: 1200, crop: "limit" }],
            },
            (error, result) => {
              if (error || !result) reject(error ?? new Error("Upload failed"));
              else resolve(result as { secure_url: string; public_id: string });
            }
          )
          .end(buffer);
      }
    );

    try {
      await connectDB();
      await UploadModel.create({
        publicId: result.public_id,
        url: result.secure_url,
        uploadedBy: session.user.id,
      });
    } catch (dbErr) {
      console.error("[upload] db tracking failed:", dbErr instanceof Error ? dbErr.message : dbErr);
    }

    return NextResponse.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[upload] failed:", msg);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
