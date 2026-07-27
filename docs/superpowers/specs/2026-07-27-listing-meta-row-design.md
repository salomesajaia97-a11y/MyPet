# Listing meta row — published date, listing ID, view count

**Date:** 2026-07-27
**Status:** approved

## Problem

A listing detail page shows the pet, the price and the seller, but nothing about
the posting itself. A buyer cannot tell whether a listing went up yesterday or
eight months ago, and a seller has no signal about whether their post is getting
attention. Competing Georgian classifieds show all three facts in one line under
the title, and buyers read them as a freshness/credibility cue.

## Scope

One meta row on the listing detail page (`/listings/[id]`), showing:

```
📅 გამოქვეყნდა 16 მაი. 2026   🏷 განცხადების ID #bf816f   👁 131 ნახვები
```

Explicitly out of scope: view counts on grid cards, on the owner's profile list,
and any analytics dashboard. Those can follow later off the same `views` field.

## Data

Real data only. No seeded, imported or estimated numbers.

- **Published date** — the existing `createdAt` timestamp. Nothing new to store.
- **Listing ID** — first 6 hex characters of the Mongo `_id`, prefixed with `#`.
  Short enough to read over the phone, and it already appears in the URL, so it
  leaks nothing.
- **Views** — new `views: Number, default: 0` on `Listing`. Existing listings
  have no field; they read as `0` and grow from real traffic from the day this
  ships.

## Counting rule: one view per visitor per day

A view is counted at most once per (listing, visitor, calendar day in
Asia/Tbilisi). An owner refreshing their own page all afternoon adds one view,
not forty.

**Dedupe store.** New `ListingView` collection: `{ key: String (unique),
expiresAt: Date }` with a TTL index that drops rows once they expire, so the
collection stays roughly the size of one day's traffic.

`key = HMAC-SHA256(AUTH_SECRET, listingId | ip | user-agent | YYYY-MM-DD)`

Hashed, so no raw IP or user agent is ever stored. `AUTH_SECRET` is reused as
the HMAC key so no new environment variable is needed.

Rejected alternative: a per-listing cookie. Browsing 50 listings would leave 50
cookies attached to every subsequent request.

**Trigger.** A client component posts once on mount. Crawlers that do not run
JavaScript are therefore never counted, which keeps the number closer to "people
who actually looked".

## Components

| Unit | Responsibility |
| --- | --- |
| `lib/marketplace/views.ts` | Pure helpers: `shortListingId`, `formatPublishedDate`, `tbilisiDayStamp`, `viewDedupeKey`. No I/O, fully unit-testable. |
| `lib/models/ListingView.ts` | Dedupe document + unique index + TTL index. |
| `POST /api/marketplace/listing/[id]/view` | Validates the id, rate-limits by IP, inserts the dedupe key, increments `views` only when the insert wins, returns `{ views }`. |
| `ViewCounter` (client) | Renders the eye + count from the server-rendered value, fires the POST once, swaps in the returned count. |
| Meta row in `page.tsx` | Server-rendered date + ID + `<ViewCounter>`, between hairline rules under the title. |

## Data flow

1. Server renders the page with `listing.createdAt` and `listing.views ?? 0`.
2. `ViewCounter` mounts and POSTs to the view route.
3. Route derives the dedupe key and attempts the insert.
   - Insert succeeds → `$inc views` → respond with the new count.
   - Duplicate key (already counted today) → respond with the current count,
     unchanged.
4. The client replaces the displayed count with the response.

## Error handling

The counter is decoration, never a blocker. A failed or rate-limited POST leaves
the server-rendered number on screen and logs nothing user-visible. A missing
listing returns 404. A DB error during increment returns 500 and the client
silently keeps the original count.

## i18n

New keys under `listings.detail` in both dictionaries: `published`, `listingId`,
`views`. Dates format through `toLocaleDateString` with `ka-GE` / `en-US` and a
short month, matching the existing convention in `profile/messages`.

## Testing

Vitest runs pure functions only (no DOM, no DB) on this machine, so:

- `shortListingId` truncates to 6 chars and tolerates short input.
- `formatPublishedDate` renders the expected day/month/year per locale.
- `tbilisiDayStamp` rolls the day over on Tbilisi time, not UTC.
- `viewDedupeKey` is stable for identical inputs and differs when any component
  (listing, ip, user agent, day) changes.

Route behaviour (first POST increments, second same-day POST does not) is
verified against the deployed environment, since `next build` OOMs locally.
