# Flitt Integration

Sells three one-time VIP promotion packages for marketplace listings.

- Design: `docs/superpowers/specs/2026-07-26-flitt-vip-payments-design.md`
- Plan: `docs/superpowers/plans/2026-07-26-flitt-vip-payments.md`

## Packages

| Tier | Days | Price | Amount sent (tetri) | Rank |
| --- | --- | --- | --- | --- |
| `standard` | 3 | 3 GEL | 300 | 1 |
| `super` | 7 | 7 GEL | 700 | 2 |
| `ultra` | 14 | 12 GEL | 1200 | 3 |

Defined once in `lib/marketplace/vipPackages.ts`. Flitt amounts are minor units
(tetri, 100 per GEL). Currency is `GEL` only.

The client sends a listing id and a tier; the server derives the amount. A
browser cannot influence what it is charged.

## Flow

```
POST /api/flitt/checkout   owner buys      -> persists Payment(created), returns checkout_url
        browser redirects to Flitt hosted page
POST /api/flitt/callback   Flitt webhook   -> AUTHORITATIVE result, grants VIP
GET|POST /api/flitt/return customer back   -> 303 to /payment/result
GET  /api/flitt/status/[orderId]           -> owner-scoped, re-polls Flitt if still pending
```

`response_url` points at `/api/flitt/return` rather than the result page
directly, because Flitt may return the customer with a POST — an App Router page
answers GET only, and a cross-site POST would not carry the SameSite=Lax session
cookie the result page needs to poll status.

## Repeat purchases

Buying again extends from the current expiry (`now + remaining + newDays`), and
the tier never downgrades. A lapsed promotion counts as rank 0, so an expired
Ultra does not upgrade a freshly bought Standard. See `lib/marketplace/vipMath.ts`.

## Idempotency

`applyVipForOrder()` claims the payment with a conditional update on
`appliedAt: null`. Flitt retries callbacks on a 2s / 60s / 300s / 600s / 1h / 24h
schedule and the status poll can reconcile concurrently, so only the caller that
wins the claim grants VIP.

## Ranking

`getListings()` computes `effRank` in an aggregation against `vipUntil` at query
time. A promotion loses its paid position the moment it expires — no cron sweep,
no window where a lapsed listing holds a slot someone else is paying for.

## Environment

| Variable | Production | Local / preview |
| --- | --- | --- |
| `FLITT_MERCHANT_ID` | real merchant id | unset → sandbox `1549901` |
| `FLITT_PAYMENT_KEY` | real payment key | unset → `"test"` |
| `FLITT_CREDIT_KEY` | real credit key | unset (unused in v1) |
| `FLITT_API_BASE` | `https://pay.flitt.com` | same |
| `NEXT_PUBLIC_SITE_URL` | `https://mypetge.online` | leave unset |

Credentials live only in Vercel environment variables. Never commit them.

Callback origin resolution (`flittBaseUrl()` in `lib/flitt/config.ts`):
production uses `SITE_URL`, preview uses its own `VERCEL_URL` so a preview
deployment never calls back into production, local falls back to localhost.

## Sandbox test cards

Any expiry and CVV.

| Card | Result |
| --- | --- |
| `4444555566661111` | approve (3DS) |
| `4444111166665555` | decline (3DS) |
| `4444555511116666` | approve (no 3DS) |
| `4444666655559999` | approve (3DS challenge) |

## Going live

1. Set `NEXT_PUBLIC_SITE_URL=https://mypetge.online` in Vercel production.
2. Confirm `https://mypetge.online/api/flitt/callback` answers directly — no
   redirect, HTTPS, under 30s. Flitt source IPs: `54.154.216.60`, `3.75.125.89`.
3. Set `FLITT_MERCHANT_ID`, `FLITT_PAYMENT_KEY`, `FLITT_CREDIT_KEY` in Vercel
   **production only**.
4. Redeploy. Buy one Standard VIP with a real card, then refund it from the
   Flitt portal.
5. **Rotate the payment key and credit key in the Flitt merchant portal.** They
   were shared in a chat transcript and must be treated as exposed. Update the
   Vercel variables to match.

## Refunds

Not implemented in-app for v1. Refund from the Flitt merchant portal, then clear
`isVip` / `vipUntil` / `vipRank` / `vipTier` on the listing via `/admin/listings`.

## Local verification

`next dev` and `next build` OOM on the 3.9 GB dev machine. Use:

```bash
npm test              # unit tests: signature, packages, VIP math
npx tsc --noEmit      # types
npm run lint
```

Browser verification happens on a Vercel preview deployment.

> If `tsc --noEmit` suddenly reports zero errors on obviously broken code, check
> `.next/dev/types/` for truncated generated files. An OOM-killed `next dev` can
> leave a half-written `routes.d.ts` / `validator.ts`, whose parse errors abort
> the whole semantic check. Delete them and let a build regenerate them.
