# Enhanced Business Reviews — Design Spec

**Date:** 2026-07-07
**Status:** Approved (design), pending implementation plan

## Goal

Extend the existing service-business review feature (vet clinics, pet hotels,
pet shops, pet-friendly places) with three capabilities:

1. **Photos + helpful votes** on reviews.
2. **Owner replies** — the user who submitted a business can reply to reviews.
3. **Edit / delete** of a reviewer's own review, with the business rating
   recomputed.

Out of scope: seller (buy-sell listing) reviews, a moderation queue, and any
change to how Google-sourced reviews behave (they stay immutable).

## Current state

- `lib/models/Review.ts` — `{ businessId, source: "google"|"native",
  reviewerName, reviewerAvatar, rating 1–5, text, googleReviewId,
  googleProfileUrl }` + timestamps. No author reference, no photos, no votes,
  no replies.
- `app/api/reviews/route.ts` — `GET ?businessId=` lists; `POST` creates a native
  review (identity from session, rate-limited 5 / 10 min) and recomputes the
  business's blended `aggregateRating` inline.
- `components/services/ServiceReviews.tsx` — ~225-line client component: fetches,
  lists, and hosts the write form. Rendered by
  `app/services/[category]/[id]/page.tsx`.
- `lib/models/Business.ts` — has `userId` (submitter/owner; **absent** on
  Google-scraped docs), `googleRating` / `googleRatingCount` baseline, and
  blended `aggregateRating` / `nativeRatingCount`.
- `app/api/upload/route.ts` — auth'd Cloudinary upload, returns
  `{ url, publicId }`. Accepts JPEG/PNG/WebP up to 5 MB. Reused for review photos.

## Architecture

Three units, each with one job:

### 1. Data model — `lib/models/Review.ts`

Add fields (all optional → backward-compatible with existing docs):

| Field | Type | Purpose |
|-------|------|---------|
| `userId` | `ObjectId → User` | Author identity for edit/delete + self-vote guard. Set on new native reviews. |
| `photos` | `[String]` | Cloudinary URLs. Max 3. |
| `helpfulUserIds` | `[ObjectId → User]` | Voters. Count = `.length`. |
| `ownerReply` | `{ text: String, createdAt: Date, updatedAt: Date }` | Single reply from the business owner. |
| `editedAt` | `Date` | Set when a review is edited; drives an "edited" label in UI. |

Existing native reviews created before this change have no `userId`; edit / delete
controls are gated on `userId` presence, so they simply aren't editable (they can
still be voted on and replied to).

### 2. Shared helper — `lib/recomputeRating.ts`

Extract the Google-baseline + native-blend math (currently inline in the POST
handler) into:

```ts
async function recomputeBusinessRating(businessId): Promise<void>
```

It: backfills `googleRating` from the pristine aggregate on the first native
review (preserving today's behavior), blends
`(googleRating*googleCount + nativeSum) / (googleCount + nativeCount)`, rounds to
1 decimal, and saves `aggregateRating` + `nativeRatingCount`. `POST`, `PATCH`,
and `DELETE` all call it — one source of truth, no divergence.

### 3. API routes

All routes keep the existing patterns: `auth()` for identity, `rateLimit()`,
session-derived identity (never client-supplied), `isValidObjectId` guards.

- **`POST /api/reviews`** (existing, extended) — additionally persist `userId`
  (from session) and `photos` (validated array of strings, ≤ 3). Then
  `recomputeBusinessRating`.
- **`PATCH /api/reviews/[id]`** (new) — author-only (`review.userId ===
  session.user.id`). Updates `rating` (int 1–5), `text` (≥ 10 chars), `photos`
  (≤ 3). Sets `editedAt`. Rejects Google-source reviews. Then recompute.
- **`DELETE /api/reviews/[id]`** (new) — author-only. Deletes the review, then
  recompute.
- **`POST /api/reviews/[id]/helpful`** (new) — any authenticated user. Toggles
  the caller's id in `helpfulUserIds`. Blocks voting on one's own review.
  Returns `{ count, voted }`.
- **`POST /api/reviews/[id]/reply`** (new) — owner-only: the review's business
  must have `userId === session.user.id`. Creates or updates `ownerReply`
  (`text` ≥ 1 char). Sets `createdAt` on first reply, `updatedAt` on edit.
- **`DELETE /api/reviews/[id]/reply`** (new) — owner-only. Clears `ownerReply`.

Authorization matrix:

| Action | Who |
|--------|-----|
| Create review | any authenticated user |
| Edit / delete review | the review's author (native, has `userId`) |
| Helpful vote | any authenticated user except the author |
| Reply / delete reply | the business owner (`business.userId`) |

### 4. UI — split `components/services/ServiceReviews.tsx`

The container is already large and will grow; split into focused units:

- **`ReviewCard.tsx`** — renders one review: avatar, name, date + "edited" label,
  stars, text, photo thumbnails, helpful button (count + voted state), edit/delete
  controls (only when the viewer is the author), and the owner-reply block. When
  the viewer is the business owner, shows an inline reply form (add / edit /
  delete).
- **`ReviewForm.tsx`** — star picker, textarea (≥ 10 chars), and photo uploader
  (reuses `/api/upload`, ≤ 3 images, JPEG/PNG/WebP ≤ 5 MB, with per-file preview
  and remove). Used for both **create** and **edit** (pre-filled in edit mode).
- **`ServiceReviews.tsx`** — container: fetches the list, renders `ReviewForm`
  (create) + a list of `ReviewCard`, and wires the action callbacks (submit,
  edit, delete, vote, reply). Refetches after mutations.

The detail page (`app/services/[category]/[id]/page.tsx`) passes a new
`ownerId={service.userId}` prop so the component knows whether the viewer may
reply. `Service` interface + `getService` projection include `userId`.

Current user id comes from `useSession().data?.user?.id` on the client for
author/owner checks (server always re-verifies).

## Data flow

1. Page server-renders business + passes `businessId`, `aggregateRating`,
   `totalCount`, `ownerId` to `ServiceReviews`.
2. Client fetches `GET /api/reviews?businessId=`.
3. Mutations (create/edit/delete/vote/reply) hit their routes; each verifies
   authorization server-side and, for rating-affecting changes, recomputes the
   aggregate. Client refetches the list (and, for vote, optimistically updates
   then reconciles).

## Error handling

- All routes return JSON `{ error }` with proper status: 400 (validation),
  401 (unauth), 403 (wrong author/owner), 404 (missing), 413 (image too large
  — from upload route), 429 (rate limit), 500.
- Google-source reviews rejected from edit/delete/author-reply with 403.
- Photo array over 3, or non-string entries → 400.
- Client shows inline error strings (Georgian), matching current form UX.

## Testing

- Unit: `recomputeBusinessRating` — Google-only, native-only, blended, first-native
  backfill, and delete-back-to-zero cases (mongodb-memory-server is already a dev
  dep).
- API: author-only edit/delete enforcement, owner-only reply enforcement,
  self-vote block, vote toggle idempotency, photo count cap, Google-review
  immutability.
- Manual: create with photos → vote → edit → owner reply → delete, verifying the
  aggregate rating updates correctly at each step.

## Non-goals / YAGNI

- No seller/listing reviews.
- No moderation/approval flow (reviews publish instantly, as today).
- No threaded/multiple owner replies — exactly one reply per review.
- No review search, sort, or pagination (current list is unpaginated; unchanged).
