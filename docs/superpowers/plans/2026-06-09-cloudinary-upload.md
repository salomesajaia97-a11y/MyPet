# Cloudinary File Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Cloudinary-backed image upload to listing creation, service creation, and user profile avatar across the Petly marketplace.

**Architecture:** Files are picked by the user → immediately uploaded to Cloudinary via a server-side API route (`POST /api/upload`) that signs the request with the secret → URLs are stored in component state and submitted with the form to existing MongoDB-backed API routes.

**Tech Stack:** Next.js 16 App Router, `cloudinary` npm package (v2 SDK), TypeScript, Tailwind CSS, existing Mongoose models.

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `lib/cloudinary.ts` | Cloudinary SDK singleton config |
| Create | `app/api/upload/route.ts` | Server-side signed upload handler |
| Create | `components/ui/ImageUploader.tsx` | Reusable drag-drop + preview upload UI |
| Create | `app/(marketplace)/listings/new/page.tsx` | New listing creation form (all 4 types) |
| Create | `app/services/new/page.tsx` | New service/business creation form |
| Modify | `lib/models/User.ts` | Add `image` field |
| Create | `app/api/user/avatar/route.ts` | PATCH endpoint to save avatar URL |
| Modify | `components/layout/Navbar.tsx` | Wire profile link to avatar upload modal |
| Modify | `next.config.ts` | Add `res.cloudinary.com` to allowed image domains |
| Modify | `.env.local` | Add 3 Cloudinary env vars |

---

## Task 1: Environment setup

**Files:**
- Modify: `.env.local`
- Modify: `next.config.ts`

- [ ] **Step 1: Install cloudinary SDK**

```bash
cd "c:/Users/User/Desktop/MyPet"
npm install cloudinary
```

Expected: `added 1 package` (or similar), no errors.

- [ ] **Step 2: Add env vars to `.env.local`**

Append these three lines to the bottom of `.env.local`:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

- [ ] **Step 3: Allow Cloudinary image domain in `next.config.ts`**

Replace the entire contents of `next.config.ts` with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 4: Commit**

```bash
git add next.config.ts package.json package-lock.json
git commit -m "chore: install cloudinary, allow res.cloudinary.com image domain"
```

---

## Task 2: Cloudinary config singleton

**Files:**
- Create: `lib/cloudinary.ts`

- [ ] **Step 1: Create `lib/cloudinary.ts`**

```ts
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "c:/Users/User/Desktop/MyPet"
npx tsc --noEmit
```

Expected: no errors related to `lib/cloudinary.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/cloudinary.ts
git commit -m "feat: add Cloudinary config singleton"
```

---

## Task 3: Upload API route

**Files:**
- Create: `app/api/upload/route.ts`

- [ ] **Step 1: Create the route**

```ts
import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const formData = await req.formData();
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

    return NextResponse.json({ url: result.secure_url, publicId: result.public_id });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Start dev server and smoke-test with curl**

In one terminal: `npm run dev`

In another terminal, create a small test jpeg and upload it:

```bash
# Download a small test image
curl -o /tmp/test.jpg "https://via.placeholder.com/100.jpg"

# POST it to the upload route
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/tmp/test.jpg;type=image/jpeg"
```

Expected response shape:
```json
{ "url": "https://res.cloudinary.com/droxb2blg/...", "publicId": "mypet/..." }
```

- [ ] **Step 3: Test rejection cases**

```bash
# Too-large file (create a 6MB file)
dd if=/dev/urandom bs=1M count=6 | base64 > /tmp/big.txt
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/tmp/big.txt;type=image/jpeg"
```

Expected: `{"error":"File exceeds 5 MB limit"}` with status 413.

```bash
# Wrong mime type
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/tmp/big.txt;type=text/plain"
```

Expected: `{"error":"Only JPEG, PNG, and WebP images are allowed"}` with status 400.

- [ ] **Step 4: Commit**

```bash
git add app/api/upload/route.ts
git commit -m "feat: add POST /api/upload Cloudinary route"
```

---

## Task 4: ImageUploader component

**Files:**
- Create: `components/ui/ImageUploader.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { X, ImagePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  single?: boolean;
}

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

type SlotState = { url: string } | { uploading: true } | { error: string };

export function ImageUploader({
  value,
  onChange,
  maxImages = 5,
  single = false,
}: ImageUploaderProps) {
  const limit = single ? 1 : maxImages;
  const inputRef = useRef<HTMLInputElement>(null);
  const [slots, setSlots] = useState<SlotState[]>(
    value.map((url) => ({ url }))
  );

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const picked = Array.from(files).slice(0, limit - slots.filter(s => "url" in s).length);

    for (const file of picked) {
      if (!ALLOWED.includes(file.type)) {
        setSlots((prev) => [...prev, { error: `${file.name}: only JPEG/PNG/WebP` }]);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setSlots((prev) => [...prev, { error: `${file.name}: max 5 MB` }]);
        continue;
      }

      const placeholderIndex = slots.length;
      setSlots((prev) => [...prev, { uploading: true }]);

      const fd = new FormData();
      fd.append("file", file);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Upload failed");

        setSlots((prev) => {
          const next = [...prev];
          next[placeholderIndex] = { url: json.url };
          const urls = next.filter((s): s is { url: string } => "url" in s).map((s) => s.url);
          onChange(urls);
          return next;
        });
      } catch (err) {
        setSlots((prev) => {
          const next = [...prev];
          next[placeholderIndex] = { error: err instanceof Error ? err.message : "Upload failed" };
          return next;
        });
      }
    }
  }

  function removeSlot(index: number) {
    setSlots((prev) => {
      const next = prev.filter((_, i) => i !== index);
      const urls = next.filter((s): s is { url: string } => "url" in s).map((s) => s.url);
      onChange(urls);
      return next;
    });
  }

  const atLimit = slots.filter((s) => "url" in s || "uploading" in s).length >= limit;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {slots.map((slot, i) => (
          <div
            key={i}
            className="relative w-24 h-24 rounded-xl overflow-hidden border border-stone-200 bg-stone-50"
          >
            {"url" in slot ? (
              <>
                <Image src={slot.url} alt="upload" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : "uploading" in slot ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-1">
                <p className="text-[10px] text-red-500 text-center leading-tight">{slot.error}</p>
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  className="mt-1 text-[10px] text-stone-400 underline"
                >
                  remove
                </button>
              </div>
            )}
          </div>
        ))}

        {!atLimit && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-24 h-24 rounded-xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center gap-1 text-stone-400 hover:border-[#0E4A5C] hover:text-[#0E4A5C] transition-colors"
          >
            <ImagePlus className="w-6 h-6" />
            <span className="text-[11px] font-medium">ფოტო</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={!single}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <p className="text-xs text-stone-400">
        მაქს. {limit} ფოტო • JPEG, PNG, WebP • 5 MB-მდე
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/ui/ImageUploader.tsx
git commit -m "feat: add ImageUploader component with upload-on-pick"
```

---

## Task 5: User model + avatar API route

**Files:**
- Modify: `lib/models/User.ts`
- Create: `app/api/user/avatar/route.ts`

- [ ] **Step 1: Add `image` field to User schema**

In `lib/models/User.ts`, update `IUser` interface and schema:

```ts
import mongoose, { Schema, model, models } from "mongoose";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: false, default: "" },
    image: { type: String, required: false },
  },
  { timestamps: true }
);

export default models.User || model<IUser>("User", UserSchema);
```

- [ ] **Step 2: Create `app/api/user/avatar/route.ts`**

```ts
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
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/models/User.ts app/api/user/avatar/route.ts
git commit -m "feat: add image field to User model + PATCH /api/user/avatar"
```

---

## Task 6: New listing creation form

**Files:**
- Create: `app/(marketplace)/listings/new/page.tsx`
- Modify: `app/(marketplace)/buy-sell/page.tsx` (wire FAB to `/listings/new`)

- [ ] **Step 1: Create the listing creation page**

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { cn } from "@/lib/utils/cn";
import type { MarketplaceType, PetSpecies } from "@/types/marketplace";

const TYPES: { value: MarketplaceType; label: string }[] = [
  { value: "buy-sell", label: "გაყიდვა" },
  { value: "adoption", label: "გაჩუქება" },
  { value: "mating", label: "შეჯვარება" },
  { value: "lost-found", label: "დაკარგული/ნაპოვნი" },
];

const SPECIES: { value: PetSpecies; label: string }[] = [
  { value: "dog", label: "ძაღლი" },
  { value: "cat", label: "კატა" },
  { value: "bird", label: "ფრინველი" },
  { value: "rabbit", label: "კურდღელი" },
  { value: "reptile", label: "რეპტილია" },
  { value: "other", label: "სხვა" },
];

export default function NewListingPage() {
  const router = useRouter();
  const [type, setType] = useState<MarketplaceType>("buy-sell");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (images.length === 0) {
      setError("გთხოვთ დაამატოთ სულ მცირე 1 ფოტო");
      return;
    }

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    const body: Record<string, unknown> = {
      ...data,
      images,
      age: Number(data.age),
    };

    if (type === "buy-sell") {
      body.price = Number(data.price);
      body.vaccinated = data.vaccinated === "on";
      body.hasPassport = data.hasPassport === "on";
    }
    if (type === "mating") {
      body.price = data.price ? Number(data.price) : null;
      body.weight = Number(data.weight);
    }
    if (type === "lost-found") {
      body.reward = data.reward ? Number(data.reward) : null;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/marketplace/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "შეცდომა");
      }
      router.push(`/${type}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "შეცდომა");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#EBF6FA] py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-[#0F2830] mb-6">განცხადების დამატება</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-6 shadow-sm">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">კატეგორია</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={cn(
                    "py-2 px-3 rounded-xl text-sm font-medium border transition-all",
                    type === t.value
                      ? "bg-[#0E4A5C] text-white border-[#0E4A5C]"
                      : "border-stone-200 text-stone-600 hover:border-stone-300"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              ფოტოები <span className="text-red-500">*</span>
            </label>
            <ImageUploader value={images} onChange={setImages} maxImages={5} />
          </div>

          {/* Species */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">სახეობა</label>
            <select name="species" required className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20">
              {SPECIES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Breed */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">ჯიში</label>
            <input name="breed" required placeholder="მაგ: ლაბრადორი" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">ასაკი (თვეებში)</label>
            <input name="age" type="number" min="0" required placeholder="მაგ: 6" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>

          {/* Type-specific fields */}
          {type === "buy-sell" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">ფასი (₾)</label>
                <input name="price" type="number" min="0" required placeholder="მაგ: 500" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">ვალუტა</label>
                <select name="currency" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20">
                  <option value="GEL">GEL ₾</option>
                  <option value="USD">USD $</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">პედიგრი</label>
                <select name="pedigree" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20">
                  <option value="none">არ აქვს</option>
                  <option value="FCI">FCI</option>
                  <option value="FCG">FCG</option>
                </select>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                  <input type="checkbox" name="vaccinated" className="rounded" />
                  ვაქცინირებული
                </label>
                <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                  <input type="checkbox" name="hasPassport" className="rounded" />
                  პასპორტი
                </label>
              </div>
            </>
          )}

          {type === "adoption" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">ხასიათი (მძდელი გამოყოფილი)</label>
                <input name="temperament" placeholder="მაგ: მოყვარული, მშვიდი, აქტიური" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                  <input type="checkbox" name="spayedNeutered" className="rounded" />
                  სტერილიზებული
                </label>
                <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                  <input type="checkbox" name="goodWithKids" className="rounded" />
                  ბავშვებთან კარგია
                </label>
                <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                  <input type="checkbox" name="goodWithPets" className="rounded" />
                  სხვა ცხოველებთან კარგია
                </label>
              </div>
            </>
          )}

          {type === "mating" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">სქესი</label>
                <select name="sex" required className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20">
                  <option value="male">მამრი</option>
                  <option value="female">მდედრი</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">წონა (კგ)</label>
                <input name="weight" type="number" min="0" step="0.1" required placeholder="მაგ: 12.5" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">პედიგრი</label>
                <select name="pedigree" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20">
                  <option value="none">არ აქვს</option>
                  <option value="FCI">FCI</option>
                  <option value="FCG">FCG</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">ფასი (₾, სურვილისამებრ)</label>
                <input name="price" type="number" min="0" placeholder="ცარიელი = უფასო" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
              </div>
            </>
          )}

          {type === "lost-found" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">სტატუსი</label>
                <select name="status" required className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20">
                  <option value="lost">დაკარგული</option>
                  <option value="found">ნაპოვნი</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">უბანი</label>
                <input name="neighborhood" required placeholder="მაგ: ვაკე" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">უკანასკნელი ნახვის თარიღი</label>
                <input name="lastSeenDate" type="date" required className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">ჯილდო (₾, სურვილისამებრ)</label>
                <input name="reward" type="number" min="0" placeholder="ცარიელი = ჯილდო არ არის" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
              </div>
            </>
          )}

          {/* Common fields */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">მდებარეობა</label>
            <input name="location" required placeholder="მაგ: თბილისი, ვაკე" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">აღწერა</label>
            <textarea name="description" required rows={4} placeholder="დეტალური აღწერა..." className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">საკონტაქტო სახელი</label>
            <input name="contactName" required placeholder="სახელი" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">ტელეფონი</label>
            <input name="contactPhone" required placeholder="+995 5XX XX XX XX" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#0E4A5C] text-white font-semibold rounded-xl hover:bg-[#0B3D4E] transition-colors disabled:opacity-50"
          >
            {submitting ? "იგზავნება..." : "განცხადების დამატება"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire the FAB in `app/(marketplace)/buy-sell/page.tsx`**

Find the `FAB` component at the bottom of the file:

```tsx
function FAB() {
  return (
    <button className="fixed bottom-6 right-6 w-14 h-14 bg-[#0E4A5C] text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-[#0B3D4E] transition-colors z-50">
      +
    </button>
  );
}
```

Replace it with:

```tsx
import Link from "next/link";

function FAB() {
  return (
    <Link
      href="/listings/new"
      className="fixed bottom-6 right-6 w-14 h-14 bg-[#0E4A5C] text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-[#0B3D4E] transition-colors z-50"
    >
      +
    </Link>
  );
}
```

Note: `Link` is already imported at the top of that file.

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Test in browser**

Navigate to `http://localhost:3000/listings/new`. Verify:
- Type tabs switch the form fields
- Uploading a photo shows spinner then thumbnail
- Submitting redirects to the correct listing page

- [ ] **Step 5: Commit**

```bash
git add "app/(marketplace)/listings/new/page.tsx" "app/(marketplace)/buy-sell/page.tsx"
git commit -m "feat: add new listing creation form with Cloudinary image upload"
```

---

## Task 7: New service creation form

**Files:**
- Create: `app/services/new/page.tsx`

- [ ] **Step 1: Create the service creation page**

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUploader } from "@/components/ui/ImageUploader";

const CATEGORIES = [
  { value: "vet-clinics", label: "ვეტ-კლინიკა" },
  { value: "pet-hotels", label: "სასტუმრო" },
  { value: "pet-shops", label: "მაღაზია" },
  { value: "pet-friendly", label: "Pet-Friendly" },
];

export default function NewServicePage() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    const body = {
      ...data,
      images,
      is24h: data.is24h === "on",
      hasEmergency: data.hasEmergency === "on",
    };

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/services/${data.category}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "შეცდომა");
      }
      router.push(`/services/${data.category}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "შეცდომა");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#EBF6FA] py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-[#0F2830] mb-6">სერვისის დამატება</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-6 shadow-sm">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">კატეგორია</label>
            <select name="category" required className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20">
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">ფოტოები</label>
            <ImageUploader value={images} onChange={setImages} maxImages={5} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">სახელი</label>
            <input name="name" required placeholder="ბიზნესის სახელი" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">მისამართი</label>
            <input name="address" required placeholder="ქუჩა, N" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">ქალაქი</label>
            <input name="city" required placeholder="მაგ: თბილისი" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">ტელეფონი</label>
            <input name="phone" required placeholder="+995 32 2 XX XX XX" className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">აღწერა</label>
            <textarea name="description" required rows={4} placeholder="სერვისის აღწერა..." className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20 resize-none" />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
              <input type="checkbox" name="is24h" className="rounded" />
              24/7 გახსნილია
            </label>
            <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
              <input type="checkbox" name="hasEmergency" className="rounded" />
              სასწრაფო სერვისი
            </label>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#0E4A5C] text-white font-semibold rounded-xl hover:bg-[#0B3D4E] transition-colors disabled:opacity-50"
          >
            {submitting ? "იგზავნება..." : "სერვისის დამატება"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Test in browser**

Navigate to `http://localhost:3000/services/new`. Verify form renders, image upload works, submit redirects to the correct service category page.

- [ ] **Step 4: Commit**

```bash
git add app/services/new/page.tsx
git commit -m "feat: add new service creation form with Cloudinary image upload"
```

---

## Task 8: Avatar upload in Navbar

**Files:**
- Modify: `components/layout/Navbar.tsx`

- [ ] **Step 1: Add avatar upload modal to `UserMenu`**

In `components/layout/Navbar.tsx`, add `ImageUploader` and `Dialog` imports at the top:

```tsx
import { ImageUploader } from "@/components/ui/ImageUploader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
```

Replace the `UserMenu` component with this version that adds a profile modal:

```tsx
function UserMenu({ session }: { session: NonNullable<ReturnType<typeof useSession>["data"]> }) {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatar, setAvatar] = useState<string[]>(
    session.user?.image ? [session.user.image] : []
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleAvatarChange(urls: string[]) {
    setAvatar(urls);
    if (urls[0]) {
      await fetch("/api/user/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urls[0] }),
      });
    }
  }

  const name = session.user?.name ?? "";
  const email = session.user?.email ?? "";
  const initial = (name || email).charAt(0).toUpperCase();
  const avatarUrl = avatar[0] ?? session.user?.image ?? null;

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex items-center gap-2 border rounded-full pl-1 pr-3 py-1 transition-all",
            open ? "border-stone-300 bg-stone-50" : "border-stone-200 hover:border-stone-300"
          )}
        >
          <div className="w-7 h-7 rounded-full bg-[#0E4A5C] flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : initial}
          </div>
          <span className="text-sm font-medium text-stone-700 max-w-[60px] truncate hidden sm:block">
            {name || email.split("@")[0]}
          </span>
          <ChevronDown className={cn("w-3.5 h-3.5 text-stone-400 transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div className="absolute right-0 top-[calc(100%+6px)] bg-white border border-stone-200 rounded-2xl shadow-xl w-64 z-50 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-4 border-b border-stone-100">
              <div className="w-10 h-10 rounded-full bg-[#0E4A5C] flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : initial}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0F2830] truncate">{email}</p>
              </div>
            </div>

            <div className="py-2">
              {[
                { icon: List, label: "ჩემი განცხადებები", href: "/buy-sell" },
                { icon: Wallet, label: "ბალანსის შევსება", href: "#" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  <item.icon className="w-4 h-4 text-stone-400 shrink-0" />
                  {item.label}
                </Link>
              ))}

              <button
                onClick={() => { setOpen(false); setProfileOpen(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <UserRound className="w-4 h-4 text-stone-400 shrink-0" />
                პროფილი
              </button>

              <div className="h-px bg-stone-100 mx-4 my-1" />

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <LogOut className="w-4 h-4 text-stone-400 shrink-0" />
                გასვლა
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>პროფილის ფოტო</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <ImageUploader value={avatar} onChange={handleAvatarChange} single />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Test in browser**

1. Log in at `http://localhost:3000/login`
2. Click profile dropdown → "პროფილი"
3. Upload a photo — should show thumbnail immediately
4. Close modal — avatar in navbar should show uploaded photo

- [ ] **Step 4: Commit**

```bash
git add components/layout/Navbar.tsx
git commit -m "feat: add avatar upload to profile modal in Navbar"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All 5 spec sections covered — upload route (Task 3), ImageUploader (Task 4), listing form (Task 6), service form (Task 7), avatar (Tasks 5+8)
- [x] **Placeholders:** None — all code blocks are complete
- [x] **Type consistency:** `ImageUploaderProps.value: string[]` / `onChange: (urls: string[]) => void` used consistently in Tasks 4, 6, 7, 8. `SlotState` union defined in Task 4 and only used there.
- [x] **`next.config.ts`:** `res.cloudinary.com` added in Task 1 so `next/image` doesn't 400 on Cloudinary URLs
- [x] **`User.image` field:** Added in Task 5 before avatar route uses it in same task
- [x] **`auth` import in avatar route:** Uses `@/auth` which is the existing NextAuth config path used by other routes
