# Cloudinary File Upload — Design Spec
Date: 2026-06-09

## Overview

Add image upload to the Petly marketplace using Cloudinary. Users can upload pet photos when creating listings, service businesses, and updating their profile avatar. Upload happens immediately on file selection (upload-on-pick). API secret stays server-side only.

---

## Architecture & Data Flow

```
User picks file
      ↓
ImageUploader component (client)
      ↓  POST multipart/form-data
/api/upload route (server)
      ↓  signs + forwards to Cloudinary
Cloudinary API
      ↓  returns { secure_url, public_id }
ImageUploader stores URLs in state
      ↓  passes string[] up via onChange
Parent form holds image URLs
      ↓  submits with rest of form data
/api/marketplace/[type] or /api/services/[category]
      ↓  saves URLs in images[] field (already in schema)
MongoDB
```

---

## New Files

| File | Purpose |
|------|---------|
| `app/api/upload/route.ts` | Server-side signed upload handler |
| `components/ui/ImageUploader.tsx` | Reusable drag-drop + preview component |
| `lib/cloudinary.ts` | Cloudinary SDK config |
| `app/(marketplace)/listings/new/page.tsx` | New listing creation form |
| `app/services/new/page.tsx` | New service business form |

---

## Environment Variables

Add to `.env.local`:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## API Route — `POST /api/upload`

- Accepts `multipart/form-data` with single `file` field
- Validates mime type (`image/jpeg`, `image/png`, `image/webp`) and size (≤5MB) server-side
- Uploads to Cloudinary folder `mypet/` using `cloudinary.uploader.upload()`
- Applies transformation: `{ width: 1200, crop: "limit" }` — caps storage, no upscale
- Returns `{ url: string, publicId: string }`
- Error responses: 400 (invalid file), 413 (too large), 500 (Cloudinary failure)
- No auth gate in initial implementation; can add `getServerSession` check later

---

## `ImageUploader` Component

**Props:**
```ts
interface ImageUploaderProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxImages?: number   // default 5
  single?: boolean     // true for avatar (maxImages forced to 1)
}
```

**UX Flow:**
1. Drag-drop zone or click-to-browse
2. File selected → immediate POST to `/api/upload`
3. Uploading: thumbnail shows spinner overlay
4. Success: spinner replaced by preview + remove (×) button
5. Error: inline error message, slot stays open for retry
6. Slots disabled when max reached

**Client-side constraints:**
- Accepted types: `image/jpeg`, `image/png`, `image/webp`
- Max 5MB per file

---

## `lib/cloudinary.ts`

```ts
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
```

---

## Integration Points

### 1. New Listing Form — `app/(marketplace)/listings/new/page.tsx`
- Fields: type, species, breed, age, location, contactName, contactPhone, description + type-specific fields (price, vaccinated, pedigree, etc.)
- `ImageUploader` at top, up to 5 images, required
- On submit → POST `/api/marketplace/[type]` with image URLs included

### 2. New Service Form — `app/services/new/page.tsx`
- Fields: name, category, location, phone, description
- `ImageUploader`, up to 5 images, optional
- On submit → POST `/api/services/[category]`

### 3. Profile Avatar — inside Navbar profile dropdown
- `ImageUploader` with `single={true}` inside a settings modal
- On change → PATCH `/api/user/avatar`
- Requires new `PATCH /api/user/avatar` route that updates `User.image` field

---

## What Does NOT Change

- `ListingCard.tsx` — already renders `listing.images[0]`, works as-is
- `Listing` mongoose schema — `images: [String]` already present
- All existing GET routes — untouched

---

## Error Handling Summary

| Scenario | Response |
|----------|----------|
| Bad mime type (client) | Blocked before upload, inline error |
| File too large (client) | Blocked before upload, inline error |
| Bad mime type (server) | 400, component shows inline error |
| File too large (server) | 413, component shows inline error |
| Cloudinary unreachable | 500, component shows retry prompt |

---

## Dependencies to Install

```bash
npm install cloudinary
```
