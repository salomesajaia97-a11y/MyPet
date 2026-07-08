# Business Ownership, Owner Dashboard & Post-Approval Editing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a business (service) owner see, manage, and edit their own business listings — including after admin approval — and hide pending businesses from the public.

**Architecture:** Mirror the existing marketplace **Listing** owner-edit flow onto the **Business** model. Ownership is `Business.userId` compared to `session.user.id`, enforced server-side in the API (source of truth); client guards are UX-only. Add a business PATCH/DELETE endpoint, an owner Edit control + pending-visibility gate on the detail page, a business edit form, and a `/profile/businesses` dashboard tab.

**Tech Stack:** Next.js 16 (App Router, typed routes, `RouteContext`/`PageProps`, async `params`), React 19, MongoDB/Mongoose, NextAuth v5 (`auth()`), Tailwind, `lucide-react`, i18n (`@/components/i18n/LanguageProvider`, dictionaries in `lib/i18n/dictionaries/{ka,en}/`).

## Global Constraints

- **Ownership key is `Business.userId`** (`ObjectId → User`). Match with `business.userId?.toString() === session.user.id`. Never add or rely on `ownerEmail`.
- **Editing an approved business must NOT change `status`.** Non-admins may never set `status`, `userId`, `category`, `source`, `placeId`, or any rating field via PATCH.
- **Ownership/authorization is enforced in the API route**, not only the UI.
- **`app/services/*` UI uses hardcoded Georgian strings** (matches existing `app/services/new/page.tsx` and detail page). **`app/profile/*` UI uses i18n** (`useT()` + dictionaries) — the Georgian dictionary `ka` is the source-of-truth type; `en` must mirror its shape exactly (`lib/i18n/index.ts:11`).
- **Next.js typed routes:** `params`/`ctx.params` are Promises — always `await` them. API route handlers use the `RouteContext<"...">` generic already used in `app/api/services/[category]/route.ts`.
- **No unit-test runner is configured** in this repo (no jest/vitest; only eslint + `mongodb-memory-server`). The verification cycle for each task is: `npx tsc --noEmit` (typecheck) + `npm run lint` + targeted manual check against the dev server (`npm run dev`, default http://localhost:3000). Do NOT invent a test framework.

## File map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `app/api/services/[category]/[id]/route.ts` | Add PATCH (owner/admin edit, status locked) + DELETE |
| Create | `app/api/profile/businesses/route.ts` | GET current user's businesses |
| Create | `components/services/ServiceOwnerControls.tsx` | Owner Edit link + Delete button (client) |
| Modify | `app/services/[category]/[id]/page.tsx` | Ownership check → Edit control; hide pending from non-owners |
| Create | `app/services/[category]/[id]/edit/page.tsx` | Owner edit form |
| Modify | `lib/i18n/dictionaries/ka/profile.ts` | Add `nav.businesses` + `businesses` block (source of truth) |
| Modify | `lib/i18n/dictionaries/en/profile.ts` | Mirror the `ka` additions |
| Modify | `app/profile/layout.tsx` | Add "My services" nav tab |
| Create | `app/api/profile/businesses/route.ts` | (see above) |
| Create | `app/profile/businesses/page.tsx` | Dashboard: cards + status badges |
| Modify | `proxy.ts` | Guard `/services/:category/:id/edit` at the edge |

---

### Task 1: Business PATCH + DELETE endpoint

**Files:**
- Modify: `app/api/services/[category]/[id]/route.ts` (currently GET-only)

**Interfaces:**
- Consumes: `auth` from `@/auth`; `handleMutationError` from `@/lib/api/errors`; `BusinessModel` from `@/lib/models/Business`; `connectDB` from `@/lib/db`.
- Produces: `PATCH /api/services/[category]/[id]` → `{ service }` (updated, 200) or error. `DELETE /api/services/[category]/[id]` → `{ success: true }` or error. Both require owner (`userId` match) or admin.

- [ ] **Step 1: Add imports and PATCH/DELETE handlers**

Edit the top import block of `app/api/services/[category]/[id]/route.ts` to add `auth` and `handleMutationError` (keep existing imports):

```ts
import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import BusinessModel from "@/lib/models/Business";
import { auth } from "@/auth";
import { handleMutationError } from "@/lib/api/errors";
```

Append after the existing `GET` handler (leave `GET` unchanged):

```ts
// PATCH /api/services/[category]/[id]
// Owner (or admin) edits their business. Approval status is intentionally
// preserved — editing an approved business keeps it approved. Ownership,
// moderation status, category, and rating/source fields can never be
// reassigned from client input.
export async function PATCH(
  req: Request,
  ctx: RouteContext<"/api/services/[category]/[id]">
) {
  const { category, id } = await ctx.params;

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    // Never let a client reassign ownership, moderation status, identity,
    // or curated/rating fields.
    delete body._id;
    delete body.status;
    delete body.userId;
    delete body.category;
    delete body.source;
    delete body.placeId;
    delete body.aggregateRating;
    delete body.googleRating;
    delete body.googleRatingCount;
    delete body.nativeRatingCount;
    delete body.createdAt;
    delete body.updatedAt;

    await connectDB();
    const business = await BusinessModel.findOne({ _id: id, category });
    if (!business) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isOwner = business.userId?.toString() === session.user.id;
    if (!isOwner && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    business.set(body);
    await business.save();
    return NextResponse.json({ service: business.toObject() });
  } catch (err) {
    return handleMutationError(err, "services/[category]/[id] PATCH");
  }
}

// DELETE /api/services/[category]/[id] — owner or admin removes a business.
export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/services/[category]/[id]">
) {
  const { category, id } = await ctx.params;

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const business = await BusinessModel.findOne({ _id: id, category });
    if (!business) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isOwner = business.userId?.toString() === session.user.id;
    if (!isOwner && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await business.deleteOne();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

Note: `session.user.role` is typed via `types/next-auth.d.ts` (already `"user" | "admin"`), same as the Listing route uses it.

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors referencing this file.

- [ ] **Step 3: Manual verification (dev server running)**

With `npm run dev` up, verify guards without a session:
Run: `curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:3000/api/services/pet-hotels/000000000000000000000000`
Expected: `401` (no session cookie).
Run: `curl -s -o /dev/null -w "%{http_code}\n" -X PATCH http://localhost:3000/api/services/bad-cat/000000000000000000000000 -H "Content-Type: application/json" -d "{}"`
Expected: `400` (invalid category).

- [ ] **Step 4: Commit**

```bash
git add "app/api/services/[category]/[id]/route.ts"
git commit -m "feat(services): owner/admin PATCH + DELETE for businesses (status preserved)"
```

---

### Task 2: Owner businesses API (dashboard data source)

**Files:**
- Create: `app/api/profile/businesses/route.ts`

**Interfaces:**
- Consumes: `auth`, `connectDB`, `BusinessModel`.
- Produces: `GET /api/profile/businesses` → `{ businesses }` (array, newest first) for the logged-in user; `401` if unauthenticated. Each business includes `_id, category, name, status, images, city, address` (full lean doc).

- [ ] **Step 1: Create the route (mirrors `app/api/profile/listings/route.ts`)**

Create `app/api/profile/businesses/route.ts`:

```ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import BusinessModel from "@/lib/models/Business";
import { auth } from "@/auth";

/** Businesses (services) created by the currently logged-in user, newest first. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const businesses = await BusinessModel.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ businesses });
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Manual verification**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/profile/businesses`
Expected: `401` (no session).

- [ ] **Step 4: Commit**

```bash
git add "app/api/profile/businesses/route.ts"
git commit -m "feat(profile): GET current user's businesses"
```

---

### Task 3: ServiceOwnerControls component

**Files:**
- Create: `components/services/ServiceOwnerControls.tsx`

**Interfaces:**
- Consumes: `DELETE /api/services/[category]/[id]` (from Task 1).
- Produces: `<ServiceOwnerControls category={string} id={string} />` — a client component rendering an Edit link (→ `/services/{category}/{id}/edit`) and a Delete button (→ DELETE, then routes to `/services/{category}`). Used by Task 4.

- [ ] **Step 1: Create the component (hardcoded Georgian — services area)**

Create `components/services/ServiceOwnerControls.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

/**
 * Owner-only action toolbar for a business/service detail page. Rendered when
 * the logged-in user owns the business (or is an admin). Edit routes to the
 * business edit form; Delete hits the business DELETE endpoint then returns to
 * the category index.
 */
export default function ServiceOwnerControls({
  category,
  id,
}: {
  category: string;
  id: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("დარწმუნებული ხართ, რომ გსურთ წაშლა?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/services/${category}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("delete failed");
      router.push(`/services/${category}`);
      router.refresh();
    } catch {
      setDeleting(false);
      alert("წაშლა ვერ მოხერხდა. სცადეთ თავიდან.");
    }
  };

  return (
    <div className="flex gap-3">
      <Link
        href={`/services/${category}/${id}/edit`}
        className="flex-1 flex items-center justify-center gap-2 bg-[#0E4A5C] hover:bg-[#0B3D4E] text-white font-semibold py-3 rounded-xl transition-colors"
      >
        <Pencil className="w-4 h-4" />
        რედაქტირება
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="flex-1 flex items-center justify-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
      >
        <Trash2 className="w-4 h-4" />
        {deleting ? "იშლება..." : "წაშლა"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors. (Unused-until-consumed is fine; it's imported in Task 4.)

- [ ] **Step 3: Commit**

```bash
git add components/services/ServiceOwnerControls.tsx
git commit -m "feat(services): ServiceOwnerControls (owner edit/delete toolbar)"
```

---

### Task 4: Detail page ownership check + pending visibility

**Files:**
- Modify: `app/services/[category]/[id]/page.tsx`

**Interfaces:**
- Consumes: `auth` from `@/auth`; `ServiceOwnerControls` (Task 3).
- Produces: detail page that (a) `notFound()`s a `pending` business for non-owner/non-admin viewers; (b) renders `ServiceOwnerControls` + a pending banner when the viewer owns the business (or is admin).

- [ ] **Step 1: Add imports**

At the top of `app/services/[category]/[id]/page.tsx`, add:

```ts
import { auth } from "@/auth";
import ServiceOwnerControls from "@/components/services/ServiceOwnerControls";
```

- [ ] **Step 2: Add `status` to the `Service` interface**

In the `interface Service { ... }` block, add these two fields (alongside `userId?: string;`):

```ts
  status?: "pending" | "approved";
```

- [ ] **Step 3: Compute ownership + gate pending visibility in the page component**

Replace the body of `ServiceDetailPage` from the `const service = await getService(...)` line down to just before the `const address = ...` line with:

```tsx
  const service = await getService(category, id);
  if (!service) notFound();

  const session = await auth();
  const isOwner =
    !!session?.user?.id && service.userId === session.user.id;
  const isAdmin = session?.user?.role === "admin";

  // A pending business is private: only its owner or an admin may view it by
  // direct URL. Everyone else gets a 404 (it isn't public until approved).
  if (service.status === "pending" && !isOwner && !isAdmin) {
    notFound();
  }
```

(Keep the existing `const address = ...` and everything after.)

- [ ] **Step 4: Render the owner controls + pending banner**

In the JSX, immediately inside `<div className="p-6 space-y-5">` (before the `{/* Title + rating */}` block), insert the owner block:

```tsx
            {(isOwner || isAdmin) && (
              <div className="space-y-3 border border-[#0E4A5C]/15 bg-[#EBF6FA] rounded-xl p-4">
                {service.status === "pending" && (
                  <p className="text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    მოდერაციაშია — ხილვადი მხოლოდ თქვენთვის
                  </p>
                )}
                <ServiceOwnerControls category={service.category} id={service._id} />
              </div>
            )}
```

- [ ] **Step 5: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 6: Manual verification**

With dev server up and logged in as a business owner, open your own approved business at `/services/<category>/<id>` → the "რედაქტირება" button and Delete are visible. Log out (or open in a private window) → a `pending` business URL returns the not-found page; an `approved` one shows no owner controls.

- [ ] **Step 7: Commit**

```bash
git add "app/services/[category]/[id]/page.tsx"
git commit -m "feat(services): owner edit controls + hide pending businesses from public"
```

---

### Task 5: Business edit page

**Files:**
- Create: `app/services/[category]/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: `GET /api/services/[category]/[id]` (returns `{ service }`), `PATCH /api/services/[category]/[id]` (Task 1); `ImageUploader` from `@/components/ui/ImageUploader`.
- Produces: client edit form. Fields mirror `app/services/new/page.tsx` (name, address, city, phone, website, description, images, is24h, hasEmergency). Category is read-only. On save → routes to `/services/{category}/{id}`.

- [ ] **Step 1: Create the edit page (mirrors services/new + listings edit load pattern)**

Create `app/services/[category]/[id]/edit/page.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ImageUploader } from "@/components/ui/ImageUploader";

const CATEGORY_LABELS: Record<string, string> = {
  "vet-clinics": "ვეტ-კლინიკა",
  "pet-hotels": "სასტუმრო",
  "pet-shops": "მაღაზია",
  "pet-friendly": "Pet-Friendly",
};

const inputCls =
  "w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/20";

interface Service {
  _id: string;
  category: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  website?: string;
  images?: string[];
  is24h?: boolean;
  hasEmergency?: boolean;
}

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams<{ category: string; id: string }>();
  const { category, id } = params;
  const { status } = useSession();

  const [service, setService] = useState<Service | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundErr, setNotFoundErr] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/services/${category}/${id}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("not found");
        const { service } = await res.json();
        if (!active) return;
        setService(service);
        setImages(service.images ?? []);
      } catch {
        if (active) setNotFoundErr(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [category, id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!service) return;
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
      const res = await fetch(`/api/services/${category}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "შეცდომა");
      }
      router.push(`/services/${category}/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "შეცდომა");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EBF6FA] flex items-center justify-center">
        <p className="text-stone-500 text-sm">იტვირთება…</p>
      </div>
    );
  }

  if (notFoundErr || !service) {
    return (
      <div className="min-h-screen bg-[#EBF6FA] flex flex-col items-center justify-center gap-4">
        <p className="text-stone-600">სერვისი ვერ მოიძებნა</p>
        <Link href="/services" className="text-sm text-[#0E4A5C] font-semibold">
          სერვისებზე დაბრუნება
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EBF6FA] py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Link
          href={`/services/${category}/${id}`}
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-[#0E4A5C] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          უკან დაბრუნება
        </Link>

        <h1 className="text-2xl font-bold text-[#0F2830] mb-6">სერვისის რედაქტირება</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-6 shadow-sm">
          {/* Category is fixed on edit */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">კატეგორია</label>
            <span className="inline-block bg-[#EBF6FA] text-[#0E4A5C] text-sm font-medium px-3 py-1.5 rounded-xl">
              {CATEGORY_LABELS[service.category] ?? service.category}
            </span>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">ფოტოები</label>
            <ImageUploader value={images} onChange={setImages} maxImages={5} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">სახელი</label>
            <input name="name" required defaultValue={service.name} className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">მისამართი</label>
            <input name="address" required defaultValue={service.address ?? ""} className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">ქალაქი</label>
            <input name="city" required defaultValue={service.city ?? ""} className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">ტელეფონი</label>
            <input name="phone" required defaultValue={service.phone ?? ""} className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">ვებ-გვერდი (სურვილისამებრ)</label>
            <input name="website" defaultValue={service.website ?? ""} className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">აღწერა</label>
            <textarea name="description" required rows={4} defaultValue={service.description ?? ""} className={`${inputCls} resize-none`} />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
              <input type="checkbox" name="is24h" defaultChecked={service.is24h} className="rounded" />
              24/7 გახსნილია
            </label>
            <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
              <input type="checkbox" name="hasEmergency" defaultChecked={service.hasEmergency} className="rounded" />
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
            {submitting ? "ინახება..." : "ცვლილებების შენახვა"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Manual verification**

Logged in as owner, visit `/services/<category>/<id>/edit` → form prefilled; change phone/description → save → redirected to detail page with the new values; the business `status` is unchanged (still approved if it was approved). Confirm in the DB or by the fact that an approved business stays publicly visible.

- [ ] **Step 4: Commit**

```bash
git add "app/services/[category]/[id]/edit/page.tsx"
git commit -m "feat(services): owner business edit page"
```

---

### Task 6: Owner dashboard page + profile nav tab + i18n

**Files:**
- Modify: `lib/i18n/dictionaries/ka/profile.ts`
- Modify: `lib/i18n/dictionaries/en/profile.ts`
- Modify: `app/profile/layout.tsx`
- Create: `app/profile/businesses/page.tsx`

**Interfaces:**
- Consumes: `GET /api/profile/businesses` (Task 2); `useT()`, `useSession()`.
- Produces: `/profile/businesses` dashboard with status badges; a new "My services" tab. New dictionary keys: `profile.nav.businesses` and a `profile.businesses` block (`title`, `empty`, `pending`, `approved`, `add`, `categories.*`).

- [ ] **Step 1: Add keys to the Georgian dictionary (source of truth)**

In `lib/i18n/dictionaries/ka/profile.ts`, add `businesses` to `nav` (after `balance:`):

```ts
    balance: "ბალანსი",
    businesses: "ჩემი სერვისები",
```

And add a top-level `businesses` block after the `listings: { ... }` block (before `favorites:`):

```ts
  businesses: {
    title: "ჩემი სერვისები",
    empty: "ჯერ არ გაქვთ დამატებული სერვისები.",
    add: "სერვისის დამატება",
    pending: "მოდერაციაშია",
    approved: "აქტიურია",
    categories: {
      "vet-clinics": "ვეტ-კლინიკა",
      "pet-hotels": "სასტუმრო",
      "pet-shops": "მაღაზია",
      "pet-friendly": "Pet-Friendly",
    },
  },
```

- [ ] **Step 2: Mirror the keys in the English dictionary**

In `lib/i18n/dictionaries/en/profile.ts`, add to `nav` (after `balance:`):

```ts
    balance: "Balance",
    businesses: "My services",
```

And add after the `listings: { ... }` block (before `favorites:`):

```ts
  businesses: {
    title: "My services",
    empty: "You haven't added any services yet.",
    add: "Add a service",
    pending: "In review",
    approved: "Active",
    categories: {
      "vet-clinics": "Vet clinic",
      "pet-hotels": "Hotel",
      "pet-shops": "Shop",
      "pet-friendly": "Pet-Friendly",
    },
  },
```

- [ ] **Step 3: Typecheck (dictionary shape must match)**

Run: `npx tsc --noEmit`
Expected: no errors. (If `en` is missing a key present in `ka`, `tsc` fails here — that's the shape guard from `lib/i18n/index.ts:11`.)

- [ ] **Step 4: Add the nav tab**

In `app/profile/layout.tsx`, add `Briefcase` to the `lucide-react` import and add a tab entry to the `TABS` array after the `listings` entry:

```ts
import { UserRound, List, Heart, MessageCircle, Wallet, Briefcase } from "lucide-react";
```

```ts
  { href: "/profile/businesses", key: "businesses", icon: Briefcase, exact: false },
```

(Place it right after the `/profile/listings` entry. `key: "businesses"` resolves to `t.profile.nav.businesses`.)

- [ ] **Step 5: Create the dashboard page (mirrors `app/profile/listings/page.tsx`)**

Create `app/profile/businesses/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

interface Business {
  _id: string;
  category: "vet-clinics" | "pet-hotels" | "pet-shops" | "pet-friendly";
  name: string;
  city?: string;
  address?: string;
  images?: string[];
  status: "pending" | "approved";
}

export default function MyBusinessesPage() {
  const { t } = useT();
  const router = useRouter();
  const { status } = useSession();
  const [businesses, setBusinesses] = useState<Business[] | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile/businesses")
      .then((r) => r.json())
      .then(({ businesses }) => setBusinesses(businesses ?? []))
      .catch(() => setBusinesses([]));
  }, [status]);

  return (
    <div className="min-h-screen bg-[#EBF6FA] py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#0F2830]">{t.profile.businesses.title}</h1>
          <Link
            href="/services/new"
            className="flex items-center gap-1.5 border border-[#0E4A5C] text-[#0E4A5C] hover:bg-[#0E4A5C] hover:text-white transition-all rounded-lg px-4 py-2 text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            {t.profile.businesses.add}
          </Link>
        </div>

        {businesses === null ? (
          <div className="py-20 text-center text-stone-400 text-sm">{t.common.actions.loading}</div>
        ) : businesses.length === 0 ? (
          <div className="py-20 text-center text-stone-400 text-sm">
            {t.profile.businesses.empty}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {businesses.map((b) => (
              <BusinessCard key={b._id} business={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BusinessCard({ business }: { business: Business }) {
  const { t } = useT();
  const isPending = business.status === "pending";

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      <Link href={`/services/${business.category}/${business._id}`} className="block">
        <div className="relative aspect-[4/3] bg-stone-100">
          {business.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.images[0]}
              alt={business.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🐾</div>
          )}
          <div
            className={
              "absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold " +
              (isPending
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700")
            }
          >
            {isPending ? t.profile.businesses.pending : t.profile.businesses.approved}
          </div>
        </div>
      </Link>
      <div className="p-4 space-y-2">
        <p className="font-bold text-[#0F2830] text-base">{business.name}</p>
        <p className="text-xs text-stone-400">
          {t.profile.businesses.categories[business.category]}
        </p>
        <Link
          href={`/services/${business.category}/${business._id}/edit`}
          className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0E4A5C] hover:underline"
        >
          <Pencil className="w-3.5 h-3.5" />
          {/* Reuse the common Edit label already present in the dictionary. */}
          {t.common.actions.edit}
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors. (Confirms `t.common.actions.edit`/`loading` and the new `t.profile.businesses.*` keys resolve.)

- [ ] **Step 7: Manual verification**

Logged in, open `/profile/businesses` → the "My services" tab is active; each of your businesses shows with a badge ("მოდერაციაშია" for pending, "აქტიურია" for approved) and an Edit link. Empty state shows the "Add a service" button.

- [ ] **Step 8: Commit**

```bash
git add lib/i18n/dictionaries/ka/profile.ts lib/i18n/dictionaries/en/profile.ts app/profile/layout.tsx "app/profile/businesses/page.tsx"
git commit -m "feat(profile): owner services dashboard with status badges + nav tab"
```

---

### Task 7: Edge guard for the edit route

**Files:**
- Modify: `proxy.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: unauthenticated requests to `/services/:category/:id/edit` are redirected to `/login` at the edge. (The API PATCH/DELETE self-guard regardless; this closes the page route.)

- [ ] **Step 1: Add the matcher entry**

In `proxy.ts`, add to the `config.matcher` array (after `"/services/new"`):

```ts
    "/services/new",
    "/services/:category/:id/edit",
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Manual verification**

Logged out, navigate to `/services/pet-hotels/<id>/edit` → redirected to `/login?callbackUrl=/services/pet-hotels/<id>/edit`.

- [ ] **Step 4: Commit**

```bash
git add proxy.ts
git commit -m "feat(services): edge-guard the business edit route"
```

---

## Self-review

**Spec coverage:**
- Ownership link (`userId`) → Global Constraints + Tasks 1, 2, 4. ✓
- Owner Edit button on detail page (`რედაქტირება`) → Tasks 3, 4. ✓
- Dashboard at profile tab with `მოდერაციაშია`/`აქტიურია` badges → Task 6. ✓
- Post-approval editing, status preserved → Task 1 (PATCH strips `status`) + Task 5 (edit form). ✓
- Hide pending from public → Task 4. ✓
- Auth/query/routing changes → Tasks 1, 2, 7. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code. Verification uses real commands (typecheck/lint/curl/manual) appropriate to a repo with no test runner. ✓

**Type consistency:** PATCH/DELETE return `{ service }`; edit page reads `{ service }` and the detail page/edit both key off `_id`, `category`, `status`, `userId` as strings (detail page serializes via `JSON.parse(JSON.stringify(doc))`). Dictionary `businesses` block added to `ka` first (source type) then mirrored in `en`. Nav tab `key: "businesses"` → `t.profile.nav.businesses`. All consistent. ✓
