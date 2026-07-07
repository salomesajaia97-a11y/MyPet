# Enhanced Business Reviews — Design Spec

**Date:** 2026-07-07
**Status:** Approved (design), pending implementation plan

## Goal

Extend the existing service-business review feature (vet clinics, pet hotels,
pet shops, pet-friendly places) with these capabilities:

1. **Photos + helpful votes** on reviews.
2. **Owner replies** — the user who submitted a business can reply to reviews.
3. **Edit / delete** of a reviewer's own review, with the business rating
   recomputed.
4. **Rating breakdown bar** — a summary showing the average, total count, and a
   per-star (5→1) distribution of native reviews.
5. **Star-only reviews** — the comment text is **optional**. A user can submit a
   star rating with no text. Rating stays required (1–5); text, if given, is just
   stored and shown.
6. **Real ratings only** — a business's displayed rating and count come solely
   from actual native reviews written on the platform. The fabricated
   "Google baseline" (hand-typed `rating`/`reviewCount` from
   `lib/data/businesses.ts`, seeded into `googleRating`/`googleRatingCount`) is
   removed from both the DB and the display. A business with no native reviews
   shows "no ratings yet."

Out of scope: seller (buy-sell listing) reviews and a moderation queue.

### Why real-only (the trigger for this work)

The rating shown today (e.g. "4.6 (52)") is **not real**. There is no live
Google integration: `scripts/scrape-osm.mjs` sets rating 0, and
`scripts/seed-curated.mjs` copies made-up `rating`/`reviewCount` numbers from
`lib/data/businesses.ts` into `googleRating`/`aggregateRating`/
`googleRatingCount`. Every star currently displayed is fabricated. This spec
makes ratings reflect only genuine user reviews.

## Current state

- `lib/models/Review.ts` — `{ businessId, source: "google"|"native",
  reviewerName, reviewerAvatar, rating 1–5, text, googleReviewId,
  googleProfileUrl }` + timestamps. No author reference, no photos, no votes,
  no replies.
- `app/api/reviews/route.ts` — `GET ?businessId=` lists; `POST` creates a native
  review (identity from session, rate-limited 5 / 10 min) and recomputes the
  business's blended `aggregateRating` inline (blend logic removed by this spec).
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

Also relax the existing `text` field: change `required: true` → optional
(`default: ""`), so a star-only review is valid.

### 2. Shared helper — `lib/recomputeRating.ts`

Extract the Google-baseline + native-blend math (currently inline in the POST
handler) into:

```ts
async function recomputeBusinessRating(businessId): Promise<void>
```

It computes the **native-only** average: `nativeSum / nativeCount`, rounded to
1 decimal (0 when there are no native reviews), and saves `aggregateRating` +
`nativeRatingCount`. No Google baseline, no blend. `POST`, `PATCH`, and `DELETE`
all call it — one source of truth, no divergence. The old blend + first-review
`googleRating` backfill are deleted from the POST handler.

### 3. API routes

All routes keep the existing patterns: `auth()` for identity, `rateLimit()`,
session-derived identity (never client-supplied), `isValidObjectId` guards.

- **`POST /api/reviews`** (existing, extended) — drop the `text ≥ 10 chars`
  requirement: `text` is now optional (trimmed; `""` allowed, capped at a sane max
  e.g. 2000 chars). Rating stays required (int 1–5). Additionally persist `userId`
  (from session) and `photos` (validated array of strings, ≤ 3). Then
  `recomputeBusinessRating`.
- **`PATCH /api/reviews/[id]`** (new) — author-only (`review.userId ===
  session.user.id`). Updates `rating` (int 1–5), `text` (optional), `photos`
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
- **`ReviewForm.tsx`** — star picker (required), optional textarea (no min
  length), and photo uploader (reuses `/api/upload`, ≤ 3 images, JPEG/PNG/WebP
  ≤ 5 MB, with per-file preview and remove). Submit is enabled once a rating is
  picked; empty text is fine. Used for both **create** and **edit** (pre-filled in
  edit mode). `ReviewCard` renders the text block only when text is non-empty.
- **`RatingSummary.tsx`** — header block: big average, star row, total count, and
  a 5→1 distribution — one bar per star level showing that level's share of
  reviews. Counts are derived client-side from the fetched native review list, so
  the bar updates for free after any create/edit/delete. When there are **zero**
  reviews it renders "no ratings yet" — no number, no stars.
- **`ServiceReviews.tsx`** — container: fetches the list, renders `RatingSummary`
  + `ReviewForm` (create) + a list of `ReviewCard`, and wires the action callbacks
  (submit, edit, delete, vote, reply). Refetches after mutations.

The detail page (`app/services/[category]/[id]/page.tsx`) passes a new
`ownerId={service.userId}` prop so the component knows whether the viewer may
reply. `Service` interface + `getService` projection include `userId`. The
page's own rating badge (currently `aggregateRating` + `googleRatingCount +
nativeRatingCount`) is changed to show a rating **only when
`nativeRatingCount > 0`**, using `nativeRatingCount` as the count — no Google
fields.

Current user id comes from `useSession().data?.user?.id` on the client for
author/owner checks (server always re-verifies).

### 5. Remove fabricated ratings

The fake ratings must disappear from both code and existing data:

- **Stop seeding fakes** — `scripts/seed-curated.mjs` sets `googleRating`,
  `aggregateRating`, `googleRatingCount` to `0` (drop the `b.rating` /
  `b.reviewCount` copy). `scripts/scrape-osm.mjs` already writes 0.
- **One-off cleanup script** — `scripts/clear-fake-ratings.mjs`: sets
  `googleRating = 0`, `googleRatingCount = 0`, and recomputes `aggregateRating` /
  `nativeRatingCount` from real native reviews for every business (0 when none).
  Idempotent, safe to re-run.
- **Category listing** — wherever cards read rating (`app/api/services/route.ts`,
  `app/api/services/[category]/route.ts`, and the card component), display a
  rating only when there are real native reviews; otherwise show no stars. The
  `googleRating` field stays in the schema (unused, always 0) to avoid a
  breaking migration.

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

- Unit: `recomputeBusinessRating` — no reviews → 0, single review, multiple
  reviews (average + rounding), and delete-back-to-zero (mongodb-memory-server is
  already a dev dep).
- API: author-only edit/delete enforcement, owner-only reply enforcement,
  self-vote block, vote toggle idempotency, photo count cap.
- Manual: create with photos → vote → edit → owner reply → delete, verifying the
  aggregate rating and the distribution bar update correctly at each step.

## Non-goals / YAGNI

- No seller/listing reviews.
- No moderation/approval flow (reviews publish instantly, as today).
- No threaded/multiple owner replies — exactly one reply per review.
- No review search, sort, or pagination (current list is unpaginated; unchanged).
