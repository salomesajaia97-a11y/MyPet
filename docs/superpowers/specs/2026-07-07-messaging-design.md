# MyPet — Messaging (Lightweight Inquiries) Design

**Date:** 2026-07-07
**Status:** Approved

Buyer-to-seller inquiries on marketplace listings. One thread per `(listing, buyer)`;
owner and buyer exchange messages via an inbox. No realtime — poll on open.

## Data model

**Thread** (`lib/models/Thread.ts`)
- `listingId: ObjectId ref Listing` (required)
- `listingTitle: string` — snapshot of the listing breed/title at creation (survives listing deletion)
- `buyerId: ObjectId ref User` (required)
- `ownerId: ObjectId ref User` (required) — the listing's `userId`
- `lastMessageAt: Date`
- `buyerReadAt: Date`, `ownerReadAt: Date` — per-side read cursors
- timestamps
- Unique compound index `(listingId, buyerId)` so a buyer has one thread per listing.

**Message** (`lib/models/Message.ts`)
- `threadId: ObjectId ref Thread` (required, indexed)
- `senderId: ObjectId ref User` (required)
- `body: string` (required, trimmed, 1–2000 chars)
- timestamps

Unread for a user = count of messages in the thread with `createdAt > myReadAt` and `senderId !== me`.

## API (all auth-gated, participant-checked, rate-limited via `lib/rateLimit`)

- `POST /api/messages` `{ listingId, body }`
  - 401 if not logged in; 400 if body empty/too long or bad listingId.
  - Load listing; 404 if missing; 400 if `listing.userId` absent (orphan) or equals the sender (can't message own listing).
  - Find-or-create thread for `(listingId, buyerId=me, ownerId=listing.userId)`, snapshot `listingTitle`.
  - Create message; bump `lastMessageAt`; set sender's readAt to now.
  - Rate limit: `messages:<userId>` 20 / 10 min.
- `GET /api/messages` → threads where I'm buyer or owner, sorted `lastMessageAt` desc, each with last-message preview, other party's name, and my unread count.
- `GET /api/messages/[id]` → messages ascending; 403 if not a participant; sets my readAt = now.
- `POST /api/messages/[id]` `{ body }` → append message; 403 if not a participant; bumps `lastMessageAt`, sets my readAt.
- `GET /api/messages/unread-count` → total unread across my threads (for the navbar dot).

## UI

- **Listing detail** (`/listings/[id]`): logged-in non-owner sees an inline "Send message" box below the contact block; posts to `POST /api/messages`, then links to the thread. Logged-out → link to `/login`. Owner viewing own listing → no box.
- **Inbox** (`/profile/messages`, server page gated by proxy): thread list (avatar/initial, other party, listing title, last message, unread badge). Client thread view at `/profile/messages/[id]`: messages + reply box, polls every ~5s while open, marks read on open.
- **Navbar**: message icon → `/profile/messages`, with an unread dot; polls `unread-count` every ~60s when authenticated (reuse a small client hook / the FavoritesProvider pattern).

## Error / edge handling

- Orphan listings (no `userId`): box hidden client-side, API rejects with 400.
- Non-participant → 403; invalid ids → 404.
- Listing deleted later: thread keeps `listingTitle` snapshot; detail link may 404 gracefully.

## Testing

- Data-layer script: create thread → message → reply → read cursor updates → unread math.
- Endpoint gating: 401 unauth, 403 non-participant, 400 self/orphan.
- Browser: send box on a listing, inbox list, thread view + reply, navbar dot.

## Out of scope (YAGNI)

Realtime/websockets, typing/read receipts, attachments, block/report, message search.
