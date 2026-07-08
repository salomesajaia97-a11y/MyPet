# Business Ownership, Owner Dashboard & Post-Approval Editing

**Date:** 2026-07-08
**Status:** Design — awaiting approval

## Problem

When a user submits a business (a "service": pet-hotel, vet-clinic, pet-shop, pet-friendly place) it enters the moderation queue as `status: "pending"`. After an admin approves it, the creator has no way to see, manage, or edit it — it looks like any other public listing. There is no owner Edit button, no "my businesses" view, and no business edit endpoint.

## Scope

Businesses (the `Business` model, discriminated by `category`) only. Marketplace `Listing`s already have owner-edit (`OwnerControls.tsx`, edit page, PATCH) and a `/profile/listings` view — out of scope.

## Decisions (confirmed)

1. **Ownership key = existing `Business.userId`** (`ObjectId → User`). No `ownerEmail` field is added. Ownership check is `business.userId?.toString() === session.user.id` (mirrors the Listing pattern at `app/api/marketplace/listing/[id]/route.ts:73-76`). Owner's email may still be displayed in UI via the session, but is never the matching key.
2. **Dashboard = new `/profile/businesses` tab** inside the existing profile shell (already auth-guarded by `proxy.ts`), consistent with `/profile/listings`. Not a standalone `/dashboard`.
3. **Editing an approved business keeps `status: "approved"`.** Owner edits save live immediately. The edit endpoint never lets a non-admin change `status`, `userId`, `category`, or rating/source fields.
4. **No moderation re-trigger** on edit.

## Architecture

Everything mirrors the existing Listing owner-edit flow. Ownership is enforced **server-side** in the API (source of truth); client guards are UX-only.

### Unit 1 — Business PATCH/DELETE endpoint
**File:** `app/api/services/[category]/[id]/route.ts` (currently GET-only — add PATCH + DELETE).

- `PATCH`: `await auth()` → 401 if no `session.user.id`. Load `BusinessModel.findById(id)` (404 if missing). Compute `isOwner = doc.userId?.toString() === session.user.id`. Require `isOwner || role === "admin"` else 403. Sanitize body — **delete** `_id, status, userId, category, source, placeId, aggregateRating, googleRating, googleRatingCount, nativeRatingCount, createdAt, updatedAt`. `doc.set(body); await doc.save()`. Return updated business. Errors via `handleMutationError(err, "services/[category]/[id] PATCH")`.
- `DELETE`: same auth/ownership guard; `findByIdAndDelete`. Owner or admin.
- Editable fields for an owner: `name, description, address, city, neighborhood, phone, website, images, tags, is24h, hasEmergency, pricePerNight, capacity, indoorAllowed, openingHours, lat, lng`.

### Unit 2 — Business detail page: ownership + visibility
**File:** `app/services/[category]/[id]/page.tsx` (server component).

- Add `const session = await auth()`; pass to `getService`.
- **Visibility fix:** a `pending` business must NOT be publicly viewable by direct URL. In `getService`, if `doc.status === "pending"` and the viewer is neither owner nor admin → treat as `notFound()`. Owner/admin can view their own pending business.
- Compute `isOwner = session?.user?.id && service.userId === session.user.id` (also `isAdmin`).
- When `isOwner || isAdmin`, render a prominent **"რედაქტირება"** (Edit listing) control near the title, linking to `/services/[category]/[id]/edit`, plus a Delete action. Implemented as a small client component (below) because Delete needs an `onClick` fetch.
- When the owner is viewing their own **pending** business, show a status banner ("მოდერაციაშია — ხილვადი მხოლოდ თქვენთვის").

### Unit 3 — `ServiceOwnerControls` client component
**File:** `components/services/ServiceOwnerControls.tsx` (mirror of `app/(marketplace)/listings/[id]/OwnerControls.tsx`).
Props: `{ category, id }`. Renders the "რედაქტირება" link (→ edit page) and a "წაშლა" (Delete) button that `DELETE`s `/api/services/[category]/[id]` then routes to `/services/[category]`. Confirm before delete.

### Unit 4 — Business edit page
**File:** `app/services/[category]/[id]/edit/page.tsx` (client form, mirror of `app/(marketplace)/listings/[id]/edit/page.tsx`).
- On mount: `GET /api/services/[category]/[id]`, prefill form (name, description, address, city, phone, website, description, images via `ImageUploader`, is24h, hasEmergency). Category is displayed read-only (fixed on edit).
- Redirect to `/login` if unauthenticated (`useSession`).
- Save: `PATCH /api/services/[category]/[id]` with body; on success route to `/services/[category]/[id]`. Shows API error text.
- Reuses the same field layout as `app/services/new/page.tsx`.

### Unit 5 — Owner dashboard (my businesses)
**Files:**
- `app/api/profile/businesses/route.ts` (GET) — mirror of `app/api/profile/listings/route.ts`: `await auth()` guard, `BusinessModel.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean()`. Returns `{ businesses }`.
- `app/profile/businesses/page.tsx` (client) — mirror of `app/profile/listings/page.tsx`: fetch the above, render clean minimalist cards. Each card: thumbnail, name, category label, **status badge**, and Edit / View links.
  - Badge: `status === "pending"` → **"მოდერაციაშია"** (amber); `status === "approved"` → **"აქტიურია"** (green/emerald).
  - Empty state + "სერვისის დამატება" button → `/services/new`.
- **Nav:** add a "ჩემი სერვისები" (My services) tab to the profile navigation (in `app/profile/layout.tsx` alongside the existing tabs).

### Unit 6 — Route protection
**File:** `proxy.ts`. Extend the matcher to guard the edit route (`/services/:category/:id/edit`) so unauthenticated users are redirected to `/login` at the edge (API still self-guards regardless). `/profile/:path*` already covers the dashboard.

## Data flow

Create (existing) → `status: pending`, `userId` = creator → admin PATCH approve → `status: approved`.
Owner visits `/profile/businesses` → sees own businesses with badges → clicks Edit → edit page loads via GET → PATCH saves (status unchanged) → live.
Owner visits public detail page of own business → sees "რედაქტირება" + Delete.

## Error handling

- API: 401 (no session), 403 (not owner/admin), 404 (missing / pending-and-not-owner), 400 (invalid id/category/JSON), 500 via `handleMutationError`.
- Client forms surface `json.error` text; disable submit while in-flight.
- Delete requires confirm.

## i18n note

Existing `app/services/*` pages use hardcoded Georgian strings; the i18n dictionary system is mid-rollout (uncommitted). To stay consistent with the surrounding services UI and keep scope tight, new UI uses hardcoded Georgian strings matching the existing pages. i18n keys can be threaded later.

## Testing / verification

- Manual/e2e flow: submit a business → confirm it is `pending` and NOT publicly visible by URL → owner sees it in `/profile/businesses` with "მოდერაციაშია" badge and can open its (private) detail page → admin approves → badge becomes "აქტიურია", now public → owner clicks Edit, changes phone/description/photos, saves → changes live, status still approved.
- Authorization: a non-owner PATCH/DELETE → 403; unauthenticated → 401; direct URL to someone else's pending business → 404.
- Reuse existing Mongo/`mongodb-memory-server` dev harness for any route-level checks.

## Out of scope

- Marketplace Listing changes, ownerEmail migration, admin business-edit UI beyond existing approve/delete, i18n keying, VIP/promotion for businesses.
