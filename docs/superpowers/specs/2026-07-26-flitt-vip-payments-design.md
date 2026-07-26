# Flitt VIP Payments — Design

**Date:** 2026-07-26
**Status:** Approved for planning
**Scope:** Sell three one-time VIP promotion packages for marketplace listings through the Flitt payment gateway.

---

## 1. Problem

MyPet listings are free to post. The platform has VIP scaffolding in place — `isVip` / `vipUntil` on the `Listing` model, `isVipActive()` in `lib/marketplace/vip.ts`, and an intentionally inert "Promote" button in `OwnerControls.tsx` — but no way for an owner to actually pay for promotion. VIP can currently only be granted by an admin.

This design wires a real checkout so listing owners can buy visibility.

## 2. Product

**Business:** MyPet (https://mypetge.online) — classifieds and services for pet owners in Georgia. Free listings for adoption, buy/sell, mating, and lost & found.

**Paid service:** digital promotional features for a listing. One-time charges. No recurring subscriptions, no physical goods, no user-to-user money movement.

### Packages

| Tier | Name | Duration | Price | Amount sent to Flitt | Rank |
| --- | --- | --- | --- | --- | --- |
| `standard` | Standard VIP | 3 days | 3 GEL | `300` | 1 |
| `super` | Super VIP | 7 days | 7 GEL | `700` | 2 |
| `ultra` | Ultra VIP / TOP | 14 days | 12 GEL | `1200` | 3 |

Flitt amounts are in minor units (tetri, 100 per GEL). Currency is always `GEL`, which is supported for Georgia-registered merchants.

### What each tier buys

- **Standard** — highlighted card, appears in the VIP section.
- **Super** — everything above, ranked ahead of Standard at the top of search results and the homepage.
- **Ultra / TOP** — highest placement platform-wide plus a priority TOP badge.

Ranking is a strict order: `ultra > super > standard > none`.

## 3. Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Checkout flow | Server-to-server `POST /api/checkout/url`, then redirect the browser to the returned `checkout_url` | The signature never enters the DOM; API errors are handled server-side; the local order is persisted before the customer leaves |
| Environment | Env-driven. Local/preview use Flitt test merchant `1549901` / secret `test`; production uses the live merchant id from env | Lets the whole flow be exercised with test cards; going live is one env change, no code change |
| Callback domain | `https://mypetge.online` | Requires `NEXT_PUBLIC_SITE_URL` set in Vercel production |
| Repeat purchase on an already-VIP listing | Extend from the current expiry; tier never downgrades | A user who buys Super with 2 days left gets `now + 2d + 7d`. No paid time is ever lost |
| Refunds | Out of scope for v1; handled manually in the Flitt merchant portal | Rare at 3–12 GEL. Refund policy is still published on the pricing page |
| Payment history | User-facing receipts plus a read-only admin table | Needed for support and reconciliation |
| Tier ranking | Numeric `vipRank` computed at query time against `vipUntil` | Expiry is exact to the second with no cron job and no stale top placement |

### Rejected alternatives

- **HTML form POST to `/api/checkout/redirect`** — signed parameters would be visible in page source, and Flitt returns errors as raw localized HTML rather than JSON, which is hard to surface well.
- **Embedded checkout token plus the Flitt JS SDK** — better UX, but adds a third-party script, CSP work, and more client-side failure modes. Reconsider after v1 ships.
- **Cron-based VIP expiry sweep** — between runs an expired listing keeps premium placement it is no longer paying for. The query-time computation avoids the problem entirely.

## 4. Architecture

```
Browser                 MyPet server                     Flitt
   |                         |                             |
   |-- POST /api/flitt/checkout (listingId, tier)           |
   |                         |-- auth + ownership + limit   |
   |                         |-- persist Payment(created)   |
   |                         |-- POST /api/checkout/url --->|
   |                         |<---- checkout_url -----------|
   |<-- { checkoutUrl } -----|                              |
   |------------------ redirect to Flitt hosted page ------>|
   |                         |                              |
   |                         |<-- POST /api/flitt/callback --|  (source of truth)
   |                         |    verify sig, apply VIP, 200 |
   |<--- redirect to /payment/result?order_id=... -----------|
   |-- GET /api/flitt/status/[orderId] --> reconcile if pending
```

The server callback is the authoritative status source. The customer return URL is for display only, and its polling endpoint doubles as a self-healing path when a callback is delayed or lost.

### Modules

```
lib/flitt/
  config.ts       merchant id, payment key, api base — all from env
  signature.ts    SHA1 sign + verify
  client.ts       createCheckoutUrl(), getOrderStatus()
  types.ts        request/response/callback shapes
lib/marketplace/
  vipPackages.ts  the three packages — single source of truth
  applyVip.ts     idempotent "approved payment -> VIP grant"
  vip.ts          existing isVipActive(), extended with rank helpers
lib/models/
  Payment.ts      new
  Listing.ts      + vipTier, + vipRank
```

Each module has one job and no knowledge of the HTTP layer above it, so signature and VIP math are unit-testable without a server or a database.

## 5. Data model

### New: `lib/models/Payment.ts`

| Field | Type | Notes |
| --- | --- | --- |
| `orderId` | String, unique, indexed | `mypet_<listingId>_<timestamp><random>`. Merchant-generated, our idempotency key |
| `listingId` | ObjectId ref Listing, indexed | |
| `userId` | ObjectId ref User, indexed | Buyer. Must own the listing at checkout time |
| `tier` | String enum `standard\|super\|ultra` | |
| `days` | Number | Snapshot of the package duration at purchase time |
| `amount` | Number | Minor units. Server-derived from `tier`, never client-supplied |
| `currency` | String, default `GEL` | |
| `status` | String enum `created\|processing\|approved\|declined\|expired\|reversed` | Mirrors Flitt `order_status` |
| `paymentId` | Number, nullable | Flitt `payment_id` |
| `responseCode` | Number, nullable | |
| `responseDescription` | String, nullable | |
| `appliedAt` | Date, nullable | Set exactly once, when VIP is granted |
| `note` | String, nullable | Operational flag for support — e.g. `listingMissing`, `amountMismatch` |
| `raw` | Mixed, nullable | Last verified callback payload, for audit |
| `createdAt` / `updatedAt` | Date | |

Indexes: `{ orderId: 1 }` unique · `{ userId: 1, createdAt: -1 }` · `{ listingId: 1 }` · `{ status: 1, createdAt: -1 }`.

The card number, CVV, and expiry never reach MyPet — the customer enters them on Flitt's hosted page. `rectoken` is not requested, since there are no saved cards or recurring charges in this design.

### Changed: `lib/models/Listing.ts`

```ts
vipTier: { type: String, enum: ["standard", "super", "ultra"], default: null },
vipRank: { type: Number, default: 0 },   // 0 none, 1 standard, 2 super, 3 ultra
```

`vipRank` is denormalized from `vipTier` so MongoDB can sort on it directly. `applyVip` is the only writer, which keeps the two in sync.

Existing `isVip` and `vipUntil` keep their current meaning. Admin-granted VIP continues to work: `isVip: true` with `vipUntil: null` means no expiry, and `vipRank` stays `0` unless the admin picks a tier.

## 6. Ranking and queries

`getListings()` in `lib/marketplace/queries.ts` currently runs `.find(filter).sort({ createdAt: -1 })`. It becomes an aggregation:

```
$match   <existing buildListingFilter output>
$addFields effRank = {
  $cond: [
    { $and: [ "$isVip", { $or: [ vipUntil == null, vipUntil > NOW ] } ] },
    { $ifNull: ["$vipRank", 0] },
    0
  ]
}
$sort    { effRank: -1, createdAt: -1 }
$skip / $limit
```

An expired promotion drops to `effRank: 0` the moment `vipUntil` passes — no background job, no window during which a lapsed listing holds a paid position.

The homepage VIP row in `app/(marketplace)/page.tsx` already filters in memory with `isVipActive()`; it additionally sorts by rank descending before slicing to 4.

`countListings()` is unaffected — ranking does not change which documents match.

`ListingSchema.index({ isVip: 1, vipUntil: 1, createdAt: -1 })` is replaced with `{ isVip: 1, vipUntil: 1, vipRank: -1, createdAt: -1 }`.

## 7. Flitt integration details

### Configuration (`lib/flitt/config.ts`)

| Env var | Production | Local / preview |
| --- | --- | --- |
| `FLITT_MERCHANT_ID` | live merchant id (Vercel env only) | `1549901` |
| `FLITT_PAYMENT_KEY` | live payment key | `test` |
| `FLITT_CREDIT_KEY` | live credit key | `testcredit` |
| `FLITT_API_BASE` | `https://pay.flitt.com` | same |
| `NEXT_PUBLIC_SITE_URL` | `https://mypetge.online` | leave unset |

Credentials live only in Vercel environment variables and a git-ignored `.env.local`. Nothing is committed. `FLITT_CREDIT_KEY` is stored now for future payouts or refunds but is unused in v1.

`NEXT_PUBLIC_SITE_URL` must stay unset locally. `lib/siteUrl.ts` documents that a localhost value would leak into canonical URLs and the sitemap. Flitt cannot reach a localhost callback in any case, so local verification of the callback path is done with a signed request replayed by hand against the dev server, and the full round trip is exercised on a Vercel preview deployment.

When `FLITT_MERCHANT_ID` is absent the module falls back to the public sandbox merchant, and throws in production rather than silently charging the wrong account.

### Callback base URL

`lib/siteUrl.ts` cannot be reused directly. Its fallback is `VERCEL_PROJECT_PRODUCTION_URL`, the stable production alias — correct for canonical URLs and the sitemap, but it would make a preview deployment send its callbacks to production and grant VIP against production data. `lib/flitt/config.ts` therefore exports its own resolver:

1. `VERCEL_ENV === "production"` → `SITE_URL` (`https://mypetge.online`).
2. `VERCEL_ENV === "preview"` → `https://${VERCEL_URL}`, the deployment-specific host, so a preview calls back to itself.
3. Otherwise (local) → `http://localhost:3000`, unreachable by Flitt and used only so the request is well-formed.

`server_callback_url` is a per-request parameter rather than a portal-registered value, so a rotating preview host is fine.

### Signature (`lib/flitt/signature.ts`)

Node `crypto`, no new dependency:

1. Start with the merchant payment secret key.
2. Drop `signature` and `response_signature_string`.
3. Drop entries whose value is `""`, `null`, or `undefined`. Keep numeric `0`.
4. Sort remaining keys alphabetically.
5. Stringify values, join with `|`.
6. SHA1 the UTF-8 bytes, lowercase hex.

Verification uses `crypto.timingSafeEqual` on equal-length buffers.

Known-good vector from the Flitt docs, used as the first unit test:

```
input:  secret "test", { merchant_id: 1549901, amount: 1000, currency: "GEL",
                         order_desc: "Test payment", order_id: "TestOrder2",
                         server_callback_url: "http://myshop/callback/" }
prehash: test|1000|GEL|1549901|Test payment|TestOrder2|http://myshop/callback/
```

### Create order (`lib/flitt/client.ts`)

`POST {FLITT_API_BASE}/api/checkout/url` with all parameters under a root `request` object:

| Parameter | Value |
| --- | --- |
| `order_id` | our generated `orderId` |
| `merchant_id` | from config |
| `order_desc` | `"MyPet VIP <tier> — <days> days — listing <id>"`, UTF-8 |
| `amount` | package minor units |
| `currency` | `GEL` |
| `server_callback_url` | `<SITE_URL>/api/flitt/callback` |
| `response_url` | `<SITE_URL>/payment/result?order_id=<orderId>` |
| `lang` | `ka` or `en`, from the locale cookie |
| `lifetime` | `3600` (one hour to complete checkout) |
| `merchant_data` | compact JSON `{ listingId, tier }` — echoed back, but never trusted over our own DB record |
| `version` | `1.0.1` |
| `signature` | computed over all of the above |

A `response.response_status` of `failure` is a request or configuration error: log `error_code` / `error_message`, mark the payment `declined`, surface a generic message to the user. Success yields `response.checkout_url`, and `payment_id` when present.

### Status polling

`POST {FLITT_API_BASE}/api/status/order_id` with `{ order_id, merchant_id, version, signature }`. Used only for payments still in `created` or `processing`.

## 8. Routes

### `POST /api/flitt/checkout`

1. `auth()` — 401 if signed out.
2. Validate `listingId` is a valid ObjectId and `tier` is one of the three packages.
3. Load the listing — 404 if missing, 403 unless `listing.userId` equals the session user.
4. Rate limit per user via the existing `lib/rateLimit.ts` — 10 attempts per hour. Checkout creation is cheap for us but not free for Flitt, and it stops runaway retry loops.
5. Generate `orderId`, persist `Payment` with `status: "created"`.
6. Call `createCheckoutUrl()`. On failure, mark the payment `declined` and return 502.
7. Return `{ checkoutUrl }`. The client sets `window.location.href`.

The amount is looked up from `vipPackages.ts` by tier. A client cannot influence the price.

### `POST /api/flitt/callback`

1. Parse the flat JSON body.
2. Verify the signature. On mismatch: log, return 400, change no state.
3. Load the `Payment` by `order_id`. Unknown order: return 200 so Flitt stops retrying, and log a warning.
4. Cross-check `amount` and `currency` against the stored payment. A mismatch is logged and the payment is flagged, not applied.
5. Update `status`, `paymentId`, `responseCode`, `responseDescription`, `raw`.
6. If `order_status === "approved"`, call `applyVip()`.
7. Return 200.

Constraints from the Flitt docs that shape this handler: no redirects may be returned, the response must arrive within 30 seconds, and only a 200 stops the retry schedule (2s, 60s, 300s, 600s, 3600s, 86400s). All work here is a signature check plus two small MongoDB writes, comfortably inside the budget. Flitt callback source IPs are `54.154.216.60` and `3.75.125.89`.

The route is exempted from any auth middleware and must not be behind a redirect.

### `GET /api/flitt/status/[orderId]`

Owner-scoped. Returns the stored payment. If the status is `created` or `processing` and the record is at least a few seconds old, it polls Flitt, reconciles through the same code path as the callback (including `applyVip`), and returns the updated record. This is what makes a lost callback recoverable without manual intervention.

### `GET /payment/result`

Server component reading `order_id`. Renders pending, success, or failure, polling the status endpoint every 2 seconds up to about 30 seconds while pending. Success links back to the promoted listing; failure offers a retry.

## 9. Granting VIP (`lib/marketplace/applyVip.ts`)

The correctness-critical path. Both the callback and the status reconciliation call it, and Flitt retries callbacks, so it must be exactly-once.

```
1. const claimed = await Payment.findOneAndUpdate(
     { orderId, status: "approved", appliedAt: null },
     { $set: { appliedAt: new Date() } },
     { new: true }
   )
2. if (!claimed) return   // already applied, or not approved — no-op
3. const listing = await Listing.findById(claimed.listingId)
4. const now  = Date.now()
   const base = listing.vipUntil && listing.vipUntil > now ? listing.vipUntil : now
   const vipUntil = base + claimed.days days        // snapshot, not current pricing
   const rank = Math.max(activeRank(listing), RANK[claimed.tier])
5. Listing.updateOne({ _id }, { isVip: true, vipUntil, vipRank: rank,
                                 vipTier: tierForRank(rank) })
```

The conditional update in step 1 is the idempotency guard: only the first caller sees `appliedAt: null`, so only one grant happens no matter how many duplicate callbacks arrive.

Duration comes from `claimed.days`, snapshotted at checkout, not from current `vipPackages.ts` values. Changing a package's length later must not retroactively alter a purchase already in flight.

`activeRank(listing)` returns `0` when the existing promotion has already lapsed, so an expired Ultra does not silently upgrade a newly bought Standard.

Edge cases:

- **Listing deleted before the callback lands** — the payment is marked `approved` and `appliedAt` is set, with a `listingMissing` note. The money was taken; support handles it manually. Logged at warning level.
- **Admin-granted VIP with `vipUntil: null`** — treated as "no expiry". A paid purchase on top of it sets a concrete `vipUntil` of `now + days` and raises the rank; it does not try to extend infinity.
- **Callback arrives while the status poll is mid-flight** — both funnel through step 1; the loser is a no-op.

## 10. User interface

| Surface | Change |
| --- | --- |
| `/vip` | New public pricing page. Three package cards, GEL prices, what each includes, refund and terms copy, links to `/terms`. Doubles as the pricing page payment providers expect to see during merchant review |
| `components/vip/PromoteDialog.tsx` | Shared client dialog: pick a tier, POST to checkout, redirect. Used by every entry point below |
| `OwnerControls.tsx` | Replace the disabled placeholder button with a `PromoteDialog` trigger. When VIP is already active, show tier, expiry date, and an "Extend" action |
| Profile › My Listings | Promote action per row |
| Post-create success | Upsell step offering the three packages for the listing just created, with a clear skip |
| Profile › Payments | Receipt list: date, listing, tier, amount, status |
| `/admin/payments` | Read-only table: date, user, listing, tier, amount, status, `order_id`, `payment_id`. Filter by status |

Listing cards gain tier-aware styling: Standard highlighted, Super highlighted and ranked above it, Ultra with a TOP badge.

All new copy goes into both `lib/i18n/dictionaries/ka.ts` and `en.ts`. Georgian is the default locale, and the `lang` sent to Flitt follows the user's locale cookie so the hosted checkout matches the site language.

## 11. Error handling

| Situation | Behavior |
| --- | --- |
| Not signed in | 401; the UI routes to login and returns to the listing |
| Not the listing owner | 403 |
| Invalid tier or listing id | 400 |
| Rate limited | 429 with a retry hint |
| Flitt `response_status: failure` | Payment marked `declined`; log `error_code` / `error_message`; generic user-facing error |
| Flitt unreachable or timing out | Payment stays `created`; user sees "try again"; no VIP granted |
| Callback signature mismatch | 400, no state change, logged with the order id |
| Callback amount or currency mismatch | Not applied; flagged for admin review; still 200 |
| Card declined | `order_status: declined` recorded; result page offers retry with a fresh order |
| Callback never arrives | The status endpoint reconciles on the next view; the record remains queryable in `/admin/payments` |

Secrets, full callback bodies containing signatures, and any card-adjacent field are never logged.

## 12. Testing

The repository has no test runner today. This change adds `vitest` for pure-function unit tests only — no DOM, no server, no database, so it runs comfortably on a constrained machine where `next build` does not.

Unit tests:

- **Signature** — the documented vector above; empty and null values omitted along with their separator; numeric `0` preserved; non-Latin (Georgian) `order_desc` hashed as UTF-8; output lowercase; `signature` and `response_signature_string` excluded from verification.
- **Packages** — tier to amount, days, and rank mapping.
- **VIP math** — fresh purchase; extension from a future expiry; expired promotion treated as fresh; rank never downgrades; admin `vipUntil: null` handled.
- **Ranking** — `effRank` is `0` for a lapsed promotion and equals `vipRank` for an active one.

Integration checks against the Flitt sandbox (merchant `1549901`, secret `test`):

- Approve path with `4444555566661111` — checkout URL created, callback verified, VIP granted, expiry correct.
- Decline path with `4444111166665555` — payment marked `declined`, no VIP.
- 3DS challenge with `4444666655559999`.
- Duplicate callback replayed by hand — VIP granted exactly once, `vipUntil` unchanged on the second delivery.
- Tampered callback — signature check rejects it with 400.

Because `next dev` and `next build` cannot run on the development machine, type safety is verified with `npx tsc --noEmit` plus `npm run lint`, and browser verification happens on a Vercel preview deployment.

## 13. Rollout

1. Merge with sandbox credentials. Production `FLITT_MERCHANT_ID` unset, so the code path uses the test merchant and no real money moves.
2. Set `NEXT_PUBLIC_SITE_URL=https://mypetge.online` in Vercel production.
3. Verify the callback endpoint is publicly reachable over HTTPS with no redirect, and register it in the Flitt merchant portal.
4. Set `FLITT_MERCHANT_ID`, `FLITT_PAYMENT_KEY`, and `FLITT_CREDIT_KEY` in Vercel production only.
5. Redeploy. Buy one Standard VIP with a real card as a smoke test, then refund it from the Flitt portal.

**Credential hygiene:** the payment key and credit private key were shared in a chat transcript and should be treated as exposed. Rotate both in the Flitt merchant portal once the integration is verified, and update the Vercel environment variables to match.

## 14. Out of scope for v1

Saved cards and `rectoken`, recurring subscriptions, preauth and capture, in-app refunds and reversals, direct card entry (PCI DSS), Apple Pay and Google Pay, promo codes and discounts, invoices, multi-currency (USD and EUR are available to Georgian merchants but the packages are GEL-only), and promoting business listings as opposed to marketplace listings.
