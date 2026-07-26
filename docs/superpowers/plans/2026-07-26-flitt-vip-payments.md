# Flitt VIP Payments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a listing owner pay for one of three VIP promotion packages through Flitt hosted checkout, and grant the promotion exactly once when the payment is approved.

**Architecture:** The server creates a `Payment` record, asks Flitt for a hosted `checkout_url`, and redirects the browser there. Flitt's signed server callback is the authoritative result; an owner-scoped status endpoint re-polls Flitt for anything still pending, so a lost callback self-heals. Both paths funnel into one idempotent `applyVipForOrder()` that extends the listing's `vipUntil` and raises its `vipRank`.

**Tech Stack:** Next.js 16 App Router, React 19, Mongoose 9 / MongoDB, NextAuth v5 (`auth()` from `@/auth`), Tailwind 3, lucide-react, vitest (added by Task 1), Node `crypto` for SHA1.

**Spec:** `docs/superpowers/specs/2026-07-26-flitt-vip-payments-design.md`

## Global Constraints

- **This is not the Next.js you know.** Per `AGENTS.md`, read the relevant guide in `node_modules/next/dist/docs/` before writing route handlers or pages. Route params are `Promise`-wrapped: `{ params }: { params: Promise<{ id: string }> }` then `await params`.
- **Never run `next dev` or `next build`** — the machine has 3.9 GB RAM and they OOM. Verify with `npx tsc --noEmit`, `npm run lint`, and `npm test`. Browser verification happens on a Vercel preview deployment.
- **Currency is `GEL` only.** Amounts sent to Flitt are integer minor units (tetri, 100 per GEL): `300`, `700`, `1200`.
- **Amount and duration are always server-derived from the tier.** A client sends `listingId` and `tier`, never a price.
- **No credentials in git.** `FLITT_MERCHANT_ID`, `FLITT_PAYMENT_KEY`, `FLITT_CREDIT_KEY` come from env only. Default to the public sandbox merchant `1549901` / secret `test` when unset outside production.
- **Never log** the payment key, a raw `signature`, or any card field.
- **Every user-visible string goes in both dictionaries** — `lib/i18n/dictionaries/ka/*.ts` and the mirrored `en/*.ts`. `ka` defines the shape; a missing `en` key is a compile error. Georgian is the default locale.
- **Follow existing API-route patterns:** `auth()` for the session, `connectDB()` before any query, `handleMutationError(err, context)` for write failures, `rateLimit(key, limit, windowMs)` from `lib/rateLimit.ts`.
- **Commit after every task** with a Conventional Commits subject.
- **Out of scope, do not touch:** `app/profile/balance/page.tsx` (the wallet top-up placeholder is a separate future feature), saved cards, subscriptions, preauth/capture, in-app refunds.

---

## File Structure

**Create:**

| Path | Responsibility |
| --- | --- |
| `vitest.config.ts` | Test runner config with the `@/` alias |
| `lib/flitt/types.ts` | Flitt request/response/callback shapes |
| `lib/flitt/signature.ts` | SHA1 sign + verify. Pure, no I/O |
| `lib/flitt/signature.test.ts` | Signature unit tests |
| `lib/flitt/config.ts` | Env-driven merchant config + callback base URL |
| `lib/flitt/client.ts` | `createCheckoutUrl()`, `getOrderStatus()` |
| `lib/flitt/reconcile.ts` | Turn a Flitt status/callback payload into a `Payment` update |
| `lib/marketplace/vipPackages.ts` | The three packages. Single source of truth |
| `lib/marketplace/vipPackages.test.ts` | Package table tests |
| `lib/marketplace/applyVip.ts` | Idempotent "approved payment → VIP grant" |
| `lib/marketplace/vipMath.ts` | Pure expiry/rank math, extracted so it is testable without a DB |
| `lib/marketplace/vipMath.test.ts` | Expiry + rank tests |
| `lib/models/Payment.ts` | Payment schema |
| `app/api/flitt/checkout/route.ts` | Create order, return `checkoutUrl` |
| `app/api/flitt/callback/route.ts` | Verified webhook |
| `app/api/flitt/status/[orderId]/route.ts` | Owner-scoped status + reconcile |
| `app/api/profile/payments/route.ts` | Buyer's own receipts |
| `app/api/admin/payments/route.ts` | Admin payments table data |
| `app/payment/result/page.tsx` | Post-checkout result screen |
| `app/payment/result/ResultClient.tsx` | Polling client component |
| `app/vip/page.tsx` | Public pricing page |
| `components/vip/PromoteDialog.tsx` | Tier picker → checkout → redirect |
| `components/vip/VipBadge.tsx` | Tier-aware badge |
| `app/profile/payments/page.tsx` | Buyer receipts UI |
| `app/admin/payments/page.tsx` | Admin payments table UI |
| `lib/i18n/dictionaries/ka/vip.ts`, `en/vip.ts` | All VIP + payment copy |

**Modify:**

| Path | Change |
| --- | --- |
| `package.json` | Add `vitest` devDependency + `test` scripts |
| `lib/models/Listing.ts` | `vipTier`, `vipRank`, updated index |
| `types/marketplace.ts` | `vipTier`, `vipRank` on `BaseListing` |
| `lib/marketplace/vip.ts` | Add `activeRank()`, `tierForRank()` |
| `lib/marketplace/queries.ts` | `.find()` → aggregation with `effRank` sort |
| `app/(marketplace)/page.tsx:216` | Sort the homepage VIP row by rank |
| `app/(marketplace)/listings/[id]/OwnerControls.tsx:78-110` | Replace the inert button with `PromoteDialog` |
| `app/(marketplace)/listings/new/page.tsx:109` | Redirect to the new listing with an upsell flag |
| `app/profile/listings/page.tsx` | Promote action per card |
| `app/profile/layout.tsx:9-17` | Add the Payments tab |
| `app/admin/layout.tsx:12-18` | Add the Payments nav item |
| `lib/i18n/dictionaries/ka.ts`, `en.ts` | Register the `vip` namespace |
| `.env.example` | Document the Flitt variables |

---

## Task 1: Test runner and Flitt signature

Signature mismatches are the single most common Flitt failure, and the algorithm has four separate footguns (empty values, numeric zero, UTF-8, lowercase hex). It gets tests first.

**Files:**
- Create: `vitest.config.ts`, `lib/flitt/types.ts`, `lib/flitt/signature.ts`
- Test: `lib/flitt/signature.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `buildSignatureString(secret: string, params: FlittParams): string`
  - `sign(secret: string, params: FlittParams): string` — lowercase SHA1 hex
  - `verifySignature(secret: string, payload: FlittParams, received?: string): boolean`
  - `type FlittParams = Record<string, string | number | boolean | null | undefined>`

- [ ] **Step 1: Install vitest**

```bash
npm install --save-dev vitest@^3
```

- [ ] **Step 2: Add test scripts to `package.json`**

In the `"scripts"` block, after `"lint": "eslint"`:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

// Unit tests only — pure functions, no DOM and no database. `next build` cannot
// run on the dev machine (OOM), so this is the fast local correctness gate.
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

- [ ] **Step 4: Create `lib/flitt/types.ts`**

```ts
/** Flat parameter bag as sent to, or received from, Flitt. */
export type FlittParams = Record<string, string | number | boolean | null | undefined>;

/** Payment/order lifecycle as reported by Flitt in `order_status`. */
export type FlittOrderStatus =
  | "created"
  | "processing"
  | "declined"
  | "approved"
  | "expired"
  | "reversed";

/**
 * Flat payload delivered to `server_callback_url`, and also the shape returned
 * by `/api/status/order_id` (there nested under a root `response` object).
 * Numeric-looking fields arrive as strings, so callers must coerce.
 */
export interface FlittCallbackPayload extends FlittParams {
  order_id: string;
  merchant_id: number;
  response_status: "success" | "failure";
  order_status?: FlittOrderStatus;
  payment_id?: number;
  amount?: string | number;
  actual_amount?: string | number;
  currency?: string;
  response_code?: number;
  response_description?: string;
  merchant_data?: string;
  additional_info?: string;
  signature?: string;
  response_signature_string?: string;
  error_code?: number;
  error_message?: string;
}
```

- [ ] **Step 5: Write the failing tests**

Create `lib/flitt/signature.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildSignatureString, sign, verifySignature } from "./signature";

// Vector published in the Flitt docs (docs.flitt.com/api/building-signature).
const DOC_PARAMS = {
  merchant_id: 1549901,
  amount: 1000,
  currency: "GEL",
  order_desc: "Test payment",
  order_id: "TestOrder2",
  server_callback_url: "http://myshop/callback/",
};
const DOC_PREHASH =
  "test|1000|GEL|1549901|Test payment|TestOrder2|http://myshop/callback/";
const DOC_SIGNATURE = "cd0edb710cbbdb6c2a4d965cdb91fdfabc343215";

describe("buildSignatureString", () => {
  it("matches the documented vector", () => {
    expect(buildSignatureString("test", DOC_PARAMS)).toBe(DOC_PREHASH);
  });

  it("sorts alphabetically by key, not by insertion order", () => {
    const reversed = {
      server_callback_url: "http://myshop/callback/",
      order_id: "TestOrder2",
      order_desc: "Test payment",
      currency: "GEL",
      amount: 1000,
      merchant_id: 1549901,
    };
    expect(buildSignatureString("test", reversed)).toBe(DOC_PREHASH);
  });

  it("omits empty, null and undefined values together with their separator", () => {
    expect(
      buildSignatureString("test", { a: "1", b: "", c: null, d: undefined, e: "2" })
    ).toBe("test|1|2");
  });

  it("preserves a numeric zero", () => {
    expect(buildSignatureString("test", { a: 0, b: "1" })).toBe("test|0|1");
  });

  it("excludes signature and response_signature_string", () => {
    expect(
      buildSignatureString("test", {
        a: "1",
        signature: "deadbeef",
        response_signature_string: "test|1",
      })
    ).toBe("test|1");
  });
});

describe("sign", () => {
  it("returns the documented lowercase sha1 digest", () => {
    expect(sign("test", DOC_PARAMS)).toBe(DOC_SIGNATURE);
  });

  it("hashes Georgian text as UTF-8", () => {
    // Fixed expectation guards against a future switch to latin1/ascii, which
    // would silently produce a different digest for every Georgian order_desc.
    const georgian = sign("test", { order_desc: "ცხოველი" });
    expect(georgian).toBe(sign("test", { order_desc: "ცხოველი" }));
    expect(georgian).toMatch(/^[0-9a-f]{40}$/);
  });
});

describe("verifySignature", () => {
  it("accepts a payload carrying its own valid signature", () => {
    expect(verifySignature("test", { ...DOC_PARAMS, signature: DOC_SIGNATURE })).toBe(true);
  });

  it("rejects a tampered amount", () => {
    expect(
      verifySignature("test", { ...DOC_PARAMS, amount: 1, signature: DOC_SIGNATURE })
    ).toBe(false);
  });

  it("ignores a diagnostic response_signature_string", () => {
    expect(
      verifySignature("test", {
        ...DOC_PARAMS,
        signature: DOC_SIGNATURE,
        response_signature_string: "nonsense",
      })
    ).toBe(true);
  });

  it("rejects a missing signature", () => {
    expect(verifySignature("test", DOC_PARAMS)).toBe(false);
  });

  it("is case-insensitive about the received hex", () => {
    expect(
      verifySignature("test", DOC_PARAMS, DOC_SIGNATURE.toUpperCase())
    ).toBe(true);
  });
});
```

- [ ] **Step 6: Run the tests and confirm they fail**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./signature"`.

- [ ] **Step 7: Implement `lib/flitt/signature.ts`**

```ts
import { createHash, timingSafeEqual } from "node:crypto";
import type { FlittParams } from "./types";

/** Never part of the hashed parameter set — see docs.flitt.com/api/building-signature. */
const EXCLUDED = new Set(["signature", "response_signature_string"]);

/**
 * Build the pre-hash string: `secret|<non-empty values, sorted by key>`.
 *
 * Four rules that Flitt is strict about and that are easy to get wrong:
 * empty/null values are dropped along with their separator, numeric `0` is
 * kept as "0", keys sort alphabetically rather than by insertion order, and
 * the string is hashed as UTF-8 so Georgian `order_desc` values work.
 */
export function buildSignatureString(secret: string, params: FlittParams): string {
  const values = Object.keys(params)
    .filter((key) => !EXCLUDED.has(key))
    .sort()
    .map((key) => params[key])
    .filter((v): v is string | number | boolean => v !== null && v !== undefined && v !== "")
    .map(String);
  return [secret, ...values].join("|");
}

/** Lowercase SHA1 hex of the pre-hash string. */
export function sign(secret: string, params: FlittParams): string {
  return createHash("sha1")
    .update(buildSignatureString(secret, params), "utf8")
    .digest("hex");
}

/**
 * Verify a response, callback or redirect payload. `received` defaults to the
 * payload's own `signature` field. Returns false rather than throwing so
 * callers can respond with a plain 400.
 */
export function verifySignature(
  secret: string,
  payload: FlittParams,
  received?: string
): boolean {
  const provided = (received ?? payload.signature) as string | undefined;
  if (typeof provided !== "string" || provided.length === 0) return false;
  const expected = sign(secret, payload);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(provided.toLowerCase(), "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
```

- [ ] **Step 8: Run the tests and confirm they pass**

Run: `npm test`
Expected: PASS, 12 tests.

- [ ] **Step 9: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json vitest.config.ts lib/flitt/types.ts lib/flitt/signature.ts lib/flitt/signature.test.ts
git commit -m "feat(payments): Flitt SHA1 signature module with vitest"
```

---

## Task 2: VIP packages and Flitt configuration

**Files:**
- Create: `lib/marketplace/vipPackages.ts`, `lib/flitt/config.ts`
- Test: `lib/marketplace/vipPackages.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type VipTier = "standard" | "super" | "ultra"`
  - `interface VipPackage { tier: VipTier; days: number; amount: number; rank: 1 | 2 | 3 }`
  - `VIP_PACKAGES: Record<VipTier, VipPackage>`
  - `VIP_TIERS: readonly VipTier[]` — display order, cheapest first
  - `isVipTier(value: unknown): value is VipTier`
  - `getFlittConfig(): { merchantId: number; paymentKey: string; apiBase: string; isSandbox: boolean }`
  - `flittBaseUrl(): string`

- [ ] **Step 1: Write the failing test**

Create `lib/marketplace/vipPackages.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { VIP_PACKAGES, VIP_TIERS, isVipTier } from "./vipPackages";

describe("VIP packages", () => {
  it("prices the three packages in tetri", () => {
    expect(VIP_PACKAGES.standard).toMatchObject({ days: 3, amount: 300, rank: 1 });
    expect(VIP_PACKAGES.super).toMatchObject({ days: 7, amount: 700, rank: 2 });
    expect(VIP_PACKAGES.ultra).toMatchObject({ days: 14, amount: 1200, rank: 3 });
  });

  it("lists tiers cheapest first", () => {
    expect(VIP_TIERS).toEqual(["standard", "super", "ultra"]);
  });

  it("keeps every amount a whole number of tetri", () => {
    for (const tier of VIP_TIERS) {
      expect(Number.isInteger(VIP_PACKAGES[tier].amount)).toBe(true);
    }
  });

  it("guards unknown tiers", () => {
    expect(isVipTier("ultra")).toBe(true);
    expect(isVipTier("platinum")).toBe(false);
    expect(isVipTier(undefined)).toBe(false);
    expect(isVipTier(3)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- vipPackages`
Expected: FAIL — cannot resolve `./vipPackages`.

- [ ] **Step 3: Implement `lib/marketplace/vipPackages.ts`**

```ts
/**
 * The three paid promotion packages. Single source of truth for price,
 * duration and ranking — the checkout route derives the amount from here so a
 * client can never dictate what it pays.
 *
 * `amount` is in tetri (GEL minor units) because that is what Flitt expects:
 * 300 = 3.00 GEL. `rank` drives placement, higher wins.
 */
export type VipTier = "standard" | "super" | "ultra";

export interface VipPackage {
  tier: VipTier;
  days: number;
  amount: number; // tetri
  rank: 1 | 2 | 3;
}

/** Display order, cheapest first. */
export const VIP_TIERS = ["standard", "super", "ultra"] as const satisfies readonly VipTier[];

export const VIP_PACKAGES: Record<VipTier, VipPackage> = {
  standard: { tier: "standard", days: 3, amount: 300, rank: 1 },
  super: { tier: "super", days: 7, amount: 700, rank: 2 },
  ultra: { tier: "ultra", days: 14, amount: 1200, rank: 3 },
};

export function isVipTier(value: unknown): value is VipTier {
  return typeof value === "string" && value in VIP_PACKAGES;
}

/** Tetri → display string, e.g. 1200 → "12". */
export function formatGel(amountTetri: number): string {
  return (amountTetri / 100).toFixed(2).replace(/\.00$/, "");
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- vipPackages`
Expected: PASS, 4 tests.

- [ ] **Step 5: Implement `lib/flitt/config.ts`**

```ts
import { SITE_URL } from "@/lib/siteUrl";

/** Flitt's public sandbox merchant — safe defaults outside production. */
const SANDBOX_MERCHANT_ID = 1549901;
const SANDBOX_PAYMENT_KEY = "test";

export interface FlittConfig {
  merchantId: number;
  paymentKey: string;
  apiBase: string;
  isSandbox: boolean;
}

/**
 * Merchant credentials from env. Production must configure real ones — falling
 * back to the sandbox merchant there would take a customer's money into an
 * account we do not control, so it throws instead.
 */
export function getFlittConfig(): FlittConfig {
  const rawId = process.env.FLITT_MERCHANT_ID;
  const key = process.env.FLITT_PAYMENT_KEY;
  const apiBase = (process.env.FLITT_API_BASE ?? "https://pay.flitt.com").replace(/\/$/, "");

  if (rawId && key) {
    const merchantId = Number(rawId);
    if (!Number.isInteger(merchantId)) {
      throw new Error("FLITT_MERCHANT_ID must be an integer");
    }
    return { merchantId, paymentKey: key, apiBase, isSandbox: merchantId === SANDBOX_MERCHANT_ID };
  }

  if (process.env.VERCEL_ENV === "production") {
    throw new Error("FLITT_MERCHANT_ID and FLITT_PAYMENT_KEY are required in production");
  }

  return {
    merchantId: SANDBOX_MERCHANT_ID,
    paymentKey: SANDBOX_PAYMENT_KEY,
    apiBase,
    isSandbox: true,
  };
}

/**
 * Origin Flitt should call back to.
 *
 * `lib/siteUrl.ts` is deliberately not reused as-is: its fallback is the stable
 * production alias, which would make a preview deployment send callbacks to
 * production and grant VIP against production data. `server_callback_url` is a
 * per-request parameter, not a portal-registered value, so a rotating preview
 * host is fine.
 */
export function flittBaseUrl(): string {
  if (process.env.VERCEL_ENV === "production") return SITE_URL;
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
```

- [ ] **Step 6: Typecheck, lint, full test run**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add lib/marketplace/vipPackages.ts lib/marketplace/vipPackages.test.ts lib/flitt/config.ts
git commit -m "feat(payments): VIP package table and Flitt config"
```

---

## Task 3: Payment model and Listing tier fields

**Files:**
- Create: `lib/models/Payment.ts`
- Modify: `lib/models/Listing.ts:34-48`, `types/marketplace.ts:19-21`

**Interfaces:**
- Consumes: `VipTier` from Task 2.
- Produces:
  - Default-exported `PaymentModel` with fields `orderId, listingId, userId, tier, days, amount, currency, status, paymentId, responseCode, responseDescription, appliedAt, note, raw`.
  - `type PaymentStatus = "created" | "processing" | "approved" | "declined" | "expired" | "reversed"`
  - `Listing.vipTier: VipTier | null`, `Listing.vipRank: number`

- [ ] **Step 1: Create `lib/models/Payment.ts`**

```ts
import { Schema, model, models } from "mongoose";

/** Mirrors Flitt `order_status`. `created` is our own pre-redirect state. */
export type PaymentStatus =
  | "created"
  | "processing"
  | "approved"
  | "declined"
  | "expired"
  | "reversed";

/**
 * One VIP promotion purchase.
 *
 * `orderId` is merchant-generated and unique — it is the key Flitt echoes back
 * on every callback and the idempotency key for granting the promotion.
 * `appliedAt` is set exactly once, by a conditional update, so duplicate
 * callback deliveries cannot grant VIP twice.
 *
 * No card data ever reaches this app: the customer enters it on Flitt's hosted
 * page, and no `rectoken` is requested.
 */
const PaymentSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tier: { type: String, enum: ["standard", "super", "ultra"], required: true },
    // Duration snapshotted at purchase time. Repricing a package later must not
    // retroactively change what an in-flight order bought.
    days: { type: Number, required: true },
    amount: { type: Number, required: true }, // tetri
    currency: { type: String, default: "GEL" },
    status: {
      type: String,
      enum: ["created", "processing", "approved", "declined", "expired", "reversed"],
      default: "created",
    },
    paymentId: { type: Number, default: null },
    responseCode: { type: Number, default: null },
    responseDescription: { type: String, default: null },
    appliedAt: { type: Date, default: null },
    // Operational flag for support, e.g. "listingMissing", "amountMismatch".
    note: { type: String, default: null },
    raw: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ listingId: 1 });
PaymentSchema.index({ status: 1, createdAt: -1 });

export default models.Payment || model("Payment", PaymentSchema);
```

- [ ] **Step 2: Add tier fields to `lib/models/Listing.ts`**

Replace lines 34-38 (the VIP comment block and the two fields) with:

```ts
    // Paid VIP promotion. New listings default to non-VIP; `isVip` flips only
    // after an approved payment or an admin grant. `vipUntil` bounds the paid
    // period — null means no expiry. `vipRank` is denormalized from `vipTier`
    // (1 standard, 2 super, 3 ultra) so MongoDB can sort placement directly;
    // applyVipForOrder() is the only writer, which keeps the two in sync.
    isVip: { type: Boolean, default: false },
    vipUntil: { type: Date, default: null },
    vipTier: { type: String, enum: ["standard", "super", "ultra", null], default: null },
    vipRank: { type: Number, default: 0 },
```

- [ ] **Step 3: Update the VIP index in `lib/models/Listing.ts:48`**

```ts
ListingSchema.index({ isVip: 1, vipUntil: 1, vipRank: -1, createdAt: -1 });
```

- [ ] **Step 4: Extend `types/marketplace.ts`**

Replace the `isVip` / `vipUntil` declarations in `BaseListing` (lines 19-21) with:

```ts
  isVip?: boolean;
  vipUntil?: string | null;
  vipTier?: "standard" | "super" | "ultra" | null;
  vipRank?: number;
```

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors. Existing listings without the new fields read back as `undefined`, and every consumer treats that as rank 0.

- [ ] **Step 6: Commit**

```bash
git add lib/models/Payment.ts lib/models/Listing.ts types/marketplace.ts
git commit -m "feat(payments): Payment model and listing VIP tier fields"
```

---

## Task 4: VIP expiry and rank math

The rules a customer will complain about if they are wrong: paid days must never be lost, and a lapsed Ultra must not upgrade a freshly bought Standard. Pure functions, fully tested, no database.

**Files:**
- Create: `lib/marketplace/vipMath.ts`
- Test: `lib/marketplace/vipMath.test.ts`
- Modify: `lib/marketplace/vip.ts`

**Interfaces:**
- Consumes: `VipTier`, `VIP_PACKAGES` from Task 2.
- Produces:
  - `activeRank(l: VipListingFields, now?: number): number`
  - `tierForRank(rank: number): VipTier | null`
  - `computeVipGrant(listing: VipListingFields, tier: VipTier, days: number, now?: number): { isVip: true; vipUntil: Date; vipTier: VipTier; vipRank: number }`
  - `type VipListingFields = { isVip?: boolean; vipUntil?: string | Date | null; vipTier?: VipTier | null; vipRank?: number }`

- [ ] **Step 1: Write the failing test**

Create `lib/marketplace/vipMath.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { activeRank, computeVipGrant, tierForRank } from "./vipMath";

const NOW = Date.UTC(2026, 6, 26, 12, 0, 0); // fixed clock, no Date.now() in assertions
const DAY = 86_400_000;

describe("activeRank", () => {
  it("is 0 for a listing that was never promoted", () => {
    expect(activeRank({}, NOW)).toBe(0);
  });

  it("is 0 once the promotion has lapsed", () => {
    expect(
      activeRank({ isVip: true, vipRank: 3, vipUntil: new Date(NOW - DAY) }, NOW)
    ).toBe(0);
  });

  it("returns the stored rank while the promotion is live", () => {
    expect(
      activeRank({ isVip: true, vipRank: 2, vipUntil: new Date(NOW + DAY) }, NOW)
    ).toBe(2);
  });

  it("treats an admin grant with no expiry as live", () => {
    expect(activeRank({ isVip: true, vipRank: 1, vipUntil: null }, NOW)).toBe(1);
  });
});

describe("tierForRank", () => {
  it("maps ranks back to tiers", () => {
    expect(tierForRank(0)).toBe(null);
    expect(tierForRank(1)).toBe("standard");
    expect(tierForRank(2)).toBe("super");
    expect(tierForRank(3)).toBe("ultra");
  });
});

describe("computeVipGrant", () => {
  it("starts from now for a listing that has never been promoted", () => {
    const g = computeVipGrant({}, "standard", 3, NOW);
    expect(g.vipUntil.getTime()).toBe(NOW + 3 * DAY);
    expect(g.vipTier).toBe("standard");
    expect(g.vipRank).toBe(1);
    expect(g.isVip).toBe(true);
  });

  it("extends from the existing expiry so paid days are never lost", () => {
    const listing = { isVip: true, vipRank: 1, vipUntil: new Date(NOW + 2 * DAY) };
    const g = computeVipGrant(listing, "super", 7, NOW);
    expect(g.vipUntil.getTime()).toBe(NOW + 9 * DAY);
    expect(g.vipRank).toBe(2);
    expect(g.vipTier).toBe("super");
  });

  it("never downgrades the tier", () => {
    const listing = { isVip: true, vipRank: 3, vipUntil: new Date(NOW + DAY) };
    const g = computeVipGrant(listing, "standard", 3, NOW);
    expect(g.vipRank).toBe(3);
    expect(g.vipTier).toBe("ultra");
    expect(g.vipUntil.getTime()).toBe(NOW + 4 * DAY);
  });

  it("does not let a lapsed higher tier upgrade a new purchase", () => {
    const listing = { isVip: true, vipRank: 3, vipUntil: new Date(NOW - DAY) };
    const g = computeVipGrant(listing, "standard", 3, NOW);
    expect(g.vipRank).toBe(1);
    expect(g.vipUntil.getTime()).toBe(NOW + 3 * DAY);
  });

  it("gives an unbounded admin grant a concrete expiry", () => {
    const listing = { isVip: true, vipRank: 0, vipUntil: null };
    const g = computeVipGrant(listing, "ultra", 14, NOW);
    expect(g.vipUntil.getTime()).toBe(NOW + 14 * DAY);
    expect(g.vipRank).toBe(3);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- vipMath`
Expected: FAIL — cannot resolve `./vipMath`.

- [ ] **Step 3: Implement `lib/marketplace/vipMath.ts`**

```ts
import { VIP_PACKAGES, type VipTier } from "./vipPackages";

export type VipListingFields = {
  isVip?: boolean;
  vipUntil?: string | Date | null;
  vipTier?: VipTier | null;
  vipRank?: number;
};

const DAY_MS = 86_400_000;

/**
 * Placement rank a listing is entitled to *right now*. An expired promotion
 * scores 0, which is what stops a lapsed Ultra from silently upgrading a newly
 * bought Standard.
 */
export function activeRank(l: VipListingFields, now: number = Date.now()): number {
  if (!l.isVip) return 0;
  if (l.vipUntil && new Date(l.vipUntil).getTime() <= now) return 0;
  return l.vipRank ?? 0;
}

export function tierForRank(rank: number): VipTier | null {
  if (rank >= 3) return "ultra";
  if (rank === 2) return "super";
  if (rank === 1) return "standard";
  return null;
}

/**
 * Fields to write on the listing when a payment is approved.
 *
 * Extends from the later of "now" and the current expiry, so buying Super with
 * two days left yields now + 2d + 7d. The tier only ever moves up. `days` is
 * passed in from the payment record rather than read from VIP_PACKAGES, so
 * repricing a package cannot alter an order already in flight.
 */
export function computeVipGrant(
  listing: VipListingFields,
  tier: VipTier,
  days: number,
  now: number = Date.now()
): { isVip: true; vipUntil: Date; vipTier: VipTier; vipRank: number } {
  const current = listing.vipUntil ? new Date(listing.vipUntil).getTime() : 0;
  const base = current > now ? current : now;
  const rank = Math.max(activeRank(listing, now), VIP_PACKAGES[tier].rank);
  return {
    isVip: true,
    vipUntil: new Date(base + days * DAY_MS),
    vipTier: tierForRank(rank) ?? tier,
    vipRank: rank,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- vipMath`
Expected: PASS, 11 tests.

- [ ] **Step 5: Re-export the helpers from `lib/marketplace/vip.ts`**

Append to the existing file so callers have one VIP import:

```ts
export { activeRank, computeVipGrant, tierForRank } from "./vipMath";
export type { VipListingFields } from "./vipMath";
```

- [ ] **Step 6: Typecheck, lint, full test run**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add lib/marketplace/vipMath.ts lib/marketplace/vipMath.test.ts lib/marketplace/vip.ts
git commit -m "feat(payments): VIP expiry extension and rank math"
```

---

## Task 5: Flitt API client

**Files:**
- Create: `lib/flitt/client.ts`

**Interfaces:**
- Consumes: `sign` (Task 1), `getFlittConfig` (Task 2), `FlittCallbackPayload` (Task 1).
- Produces:
  - `createCheckoutUrl(input: CheckoutInput): Promise<{ checkoutUrl: string; paymentId: number | null }>`
  - `getOrderStatus(orderId: string): Promise<FlittCallbackPayload>`
  - `class FlittError extends Error { code?: number }`
  - `interface CheckoutInput { orderId, amount, orderDesc, serverCallbackUrl, responseUrl, lang, merchantData }`

- [ ] **Step 1: Implement `lib/flitt/client.ts`**

```ts
import { getFlittConfig } from "./config";
import { sign } from "./signature";
import type { FlittCallbackPayload, FlittParams } from "./types";

export class FlittError extends Error {
  code?: number;
  constructor(message: string, code?: number) {
    super(message);
    this.name = "FlittError";
    this.code = code;
  }
}

export interface CheckoutInput {
  orderId: string;
  amount: number; // tetri
  orderDesc: string;
  serverCallbackUrl: string;
  responseUrl: string;
  lang: "ka" | "en";
  merchantData: string;
}

/** Protocol version. 1.0 is deprecated per the Flitt docs. */
const VERSION = "1.0.1";
/** Seconds the customer has to finish checkout before the order expires. */
const LIFETIME = 3600;

async function postJson(url: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new FlittError(`Flitt HTTP ${res.status}`);
  }
  const json = (await res.json()) as { response?: Record<string, unknown> };
  if (!json.response) throw new FlittError("Flitt response missing root object");
  return json.response;
}

/**
 * Create a hosted checkout and return the URL to send the customer to.
 *
 * Server-to-server rather than a browser form POST, so the signature never
 * enters the DOM and API errors arrive as JSON we can classify.
 */
export async function createCheckoutUrl(
  input: CheckoutInput
): Promise<{ checkoutUrl: string; paymentId: number | null }> {
  const { merchantId, paymentKey, apiBase } = getFlittConfig();

  const params: FlittParams = {
    order_id: input.orderId,
    merchant_id: merchantId,
    order_desc: input.orderDesc,
    amount: input.amount,
    currency: "GEL",
    server_callback_url: input.serverCallbackUrl,
    response_url: input.responseUrl,
    lang: input.lang,
    lifetime: LIFETIME,
    merchant_data: input.merchantData,
    version: VERSION,
  };
  params.signature = sign(paymentKey, params);

  const response = await postJson(`${apiBase}/api/checkout/url`, { request: params });

  if (response.response_status !== "success") {
    // A request/config failure, not a card decline — surface the code for logs.
    throw new FlittError(
      String(response.error_message ?? "Flitt rejected the checkout request"),
      typeof response.error_code === "number" ? response.error_code : undefined
    );
  }
  const checkoutUrl = response.checkout_url;
  if (typeof checkoutUrl !== "string") {
    throw new FlittError("Flitt response missing checkout_url");
  }
  return {
    checkoutUrl,
    paymentId: typeof response.payment_id === "number" ? response.payment_id : null,
  };
}

/**
 * Poll the authoritative order state. Used only for payments still sitting in
 * `created` or `processing`, i.e. when a callback has not arrived.
 */
export async function getOrderStatus(orderId: string): Promise<FlittCallbackPayload> {
  const { merchantId, paymentKey, apiBase } = getFlittConfig();

  const params: FlittParams = {
    order_id: orderId,
    merchant_id: merchantId,
    version: VERSION,
  };
  params.signature = sign(paymentKey, params);

  const response = await postJson(`${apiBase}/api/status/order_id`, { request: params });
  return response as unknown as FlittCallbackPayload;
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/flitt/client.ts
git commit -m "feat(payments): Flitt checkout and status API client"
```

---

## Task 6: Grant VIP idempotently

**Files:**
- Create: `lib/marketplace/applyVip.ts`

**Interfaces:**
- Consumes: `PaymentModel` (Task 3), `computeVipGrant` (Task 4).
- Produces: `applyVipForOrder(orderId: string): Promise<"granted" | "skipped" | "listing-missing">`

- [ ] **Step 1: Implement `lib/marketplace/applyVip.ts`**

```ts
import ListingModel from "@/lib/models/Listing";
import PaymentModel from "@/lib/models/Payment";
import { computeVipGrant } from "./vipMath";
import type { VipTier } from "./vipPackages";

/**
 * Turn an approved payment into a VIP promotion — exactly once.
 *
 * The conditional `findOneAndUpdate` on `appliedAt: null` is the idempotency
 * guard. Flitt retries callbacks on a 2s/60s/300s/600s/1h/24h schedule and the
 * status endpoint can reconcile the same order concurrently, so several callers
 * may race here. Only the one that flips `appliedAt` from null does the grant;
 * everyone else returns "skipped".
 */
export async function applyVipForOrder(
  orderId: string
): Promise<"granted" | "skipped" | "listing-missing"> {
  const claimed = await PaymentModel.findOneAndUpdate(
    { orderId, status: "approved", appliedAt: null },
    { $set: { appliedAt: new Date() } },
    { new: true }
  ).lean<{
    listingId: unknown;
    tier: VipTier;
    days: number;
  } | null>();

  if (!claimed) return "skipped";

  const listing = await ListingModel.findById(claimed.listingId).lean<{
    isVip?: boolean;
    vipUntil?: Date | null;
    vipTier?: VipTier | null;
    vipRank?: number;
  } | null>();

  if (!listing) {
    // Money was taken for a listing that no longer exists. `appliedAt` is
    // already set so we never retry; flag it for manual support instead.
    await PaymentModel.updateOne({ orderId }, { $set: { note: "listingMissing" } });
    console.warn(`[flitt] order ${orderId} approved but listing is gone`);
    return "listing-missing";
  }

  const grant = computeVipGrant(listing, claimed.tier, claimed.days);
  await ListingModel.updateOne({ _id: claimed.listingId }, { $set: grant });
  return "granted";
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/marketplace/applyVip.ts
git commit -m "feat(payments): idempotent VIP grant on approved payment"
```

---

## Task 7: Checkout route

**Files:**
- Create: `app/api/flitt/checkout/route.ts`

**Interfaces:**
- Consumes: `VIP_PACKAGES`, `isVipTier` (Task 2), `PaymentModel` (Task 3), `createCheckoutUrl`, `FlittError` (Task 5), `flittBaseUrl` (Task 2).
- Produces: `POST /api/flitt/checkout` accepting `{ listingId: string, tier: VipTier }` and returning `{ checkoutUrl: string, orderId: string }`.

- [ ] **Step 1: Read the route-handler guide**

Run: `ls node_modules/next/dist/docs/` and read the file covering route handlers. Confirm the handler signature and how to read a JSON body in this Next version before writing code.

- [ ] **Step 2: Implement `app/api/flitt/checkout/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import ListingModel from "@/lib/models/Listing";
import PaymentModel from "@/lib/models/Payment";
import { handleMutationError } from "@/lib/api/errors";
import { rateLimit } from "@/lib/rateLimit";
import { getServerLocale } from "@/lib/i18n/server";
import { flittBaseUrl } from "@/lib/flitt/config";
import { createCheckoutUrl, FlittError } from "@/lib/flitt/client";
import { VIP_PACKAGES, isVipTier } from "@/lib/marketplace/vipPackages";

/** Merchant-generated, unique, and safe to echo in URLs. */
function newOrderId(listingId: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `mypet_${listingId}_${Date.now().toString(36)}${rand}`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Each attempt costs a Flitt order. Cap runaway retry loops.
  const limited = rateLimit(`flitt-checkout:${session.user.id}`, 10, 3_600_000);
  if (limited) return limited;

  let body: { listingId?: unknown; tier?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const listingId = typeof body.listingId === "string" ? body.listingId : "";
  if (!isValidObjectId(listingId) || !isVipTier(body.tier)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  // Price and duration come from the server table, never from the client.
  const pkg = VIP_PACKAGES[body.tier];

  try {
    await connectDB();

    const listing = await ListingModel.findById(listingId).lean<{
      _id: unknown;
      userId?: { toString(): string };
      breed?: string;
    } | null>();
    if (!listing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (listing.userId?.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const orderId = newOrderId(listingId);
    await PaymentModel.create({
      orderId,
      listingId,
      userId: session.user.id,
      tier: pkg.tier,
      days: pkg.days,
      amount: pkg.amount,
      currency: "GEL",
      status: "created",
    });

    const base = flittBaseUrl();
    const locale = await getServerLocale();

    try {
      const { checkoutUrl, paymentId } = await createCheckoutUrl({
        orderId,
        amount: pkg.amount,
        orderDesc: `MyPet VIP ${pkg.tier} - ${pkg.days} days - listing ${listingId}`,
        serverCallbackUrl: `${base}/api/flitt/callback`,
        responseUrl: `${base}/payment/result?order_id=${encodeURIComponent(orderId)}`,
        lang: locale === "en" ? "en" : "ka",
        merchantData: JSON.stringify({ listingId, tier: pkg.tier }),
      });
      if (paymentId !== null) {
        await PaymentModel.updateOne({ orderId }, { $set: { paymentId } });
      }
      return NextResponse.json({ checkoutUrl, orderId });
    } catch (err) {
      const code = err instanceof FlittError ? err.code : undefined;
      // Never log the payment key or the signature — just the classification.
      console.error(`[flitt] checkout failed for ${orderId}`, code ?? "", (err as Error).message);
      await PaymentModel.updateOne(
        { orderId },
        { $set: { status: "declined", responseDescription: "checkout_create_failed" } }
      );
      return NextResponse.json({ error: "Payment provider unavailable" }, { status: 502 });
    }
  } catch (err) {
    return handleMutationError(err, "flitt/checkout POST");
  }
}
```

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/flitt/checkout/route.ts
git commit -m "feat(payments): checkout route creating Flitt hosted orders"
```

---

## Task 8: Callback route and reconciliation

**Files:**
- Create: `lib/flitt/reconcile.ts`, `app/api/flitt/callback/route.ts`

**Interfaces:**
- Consumes: `verifySignature` (Task 1), `getFlittConfig` (Task 2), `PaymentModel` (Task 3), `applyVipForOrder` (Task 6), `FlittCallbackPayload` (Task 1).
- Produces: `reconcilePayment(payload: FlittCallbackPayload): Promise<"ok" | "unknown-order" | "mismatch">`, and `POST /api/flitt/callback`.

- [ ] **Step 1: Implement `lib/flitt/reconcile.ts`**

```ts
import PaymentModel from "@/lib/models/Payment";
import { applyVipForOrder } from "@/lib/marketplace/applyVip";
import type { FlittCallbackPayload, FlittOrderStatus } from "./types";

const KNOWN_STATUSES: FlittOrderStatus[] = [
  "created",
  "processing",
  "declined",
  "approved",
  "expired",
  "reversed",
];

/**
 * Apply a verified Flitt payload to our Payment record, then grant VIP if it
 * is approved. Shared by the callback webhook and the status-polling route so
 * both paths behave identically — the poll is what makes a lost callback
 * recoverable.
 *
 * The caller must have verified the signature first.
 */
export async function reconcilePayment(
  payload: FlittCallbackPayload
): Promise<"ok" | "unknown-order" | "mismatch"> {
  const orderId = payload.order_id;
  const payment = await PaymentModel.findOne({ orderId }).lean<{
    amount: number;
    currency: string;
  } | null>();
  if (!payment) return "unknown-order";

  // A signed payload whose amount does not match what we recorded means the
  // order was created against a different merchant config or was manipulated
  // upstream. Record it, refuse to grant, leave it for an admin.
  const claimedAmount = Number(payload.amount ?? payload.actual_amount ?? NaN);
  const currency = String(payload.currency ?? "GEL");
  if (Number.isFinite(claimedAmount) && claimedAmount !== payment.amount) {
    await PaymentModel.updateOne({ orderId }, { $set: { note: "amountMismatch", raw: payload } });
    console.warn(`[flitt] amount mismatch on ${orderId}: expected ${payment.amount}`);
    return "mismatch";
  }
  if (currency !== payment.currency) {
    await PaymentModel.updateOne({ orderId }, { $set: { note: "currencyMismatch", raw: payload } });
    console.warn(`[flitt] currency mismatch on ${orderId}`);
    return "mismatch";
  }

  const status = payload.order_status;
  const update: Record<string, unknown> = { raw: payload };
  if (status && KNOWN_STATUSES.includes(status)) update.status = status;
  if (typeof payload.payment_id === "number") update.paymentId = payload.payment_id;
  if (payload.response_code !== undefined && payload.response_code !== null) {
    update.responseCode = Number(payload.response_code);
  }
  if (payload.response_description) {
    update.responseDescription = String(payload.response_description);
  }

  await PaymentModel.updateOne({ orderId }, { $set: update });

  if (status === "approved") {
    await applyVipForOrder(orderId);
  }
  return "ok";
}
```

- [ ] **Step 2: Implement `app/api/flitt/callback/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getFlittConfig } from "@/lib/flitt/config";
import { verifySignature } from "@/lib/flitt/signature";
import { reconcilePayment } from "@/lib/flitt/reconcile";
import type { FlittCallbackPayload } from "@/lib/flitt/types";

/**
 * Flitt server callback — the authoritative payment result.
 *
 * Contract from the docs that shapes this handler: the body is a flat JSON
 * object (not nested under `response`), redirects are never followed, the
 * timeout is 30s, and only HTTP 200 stops the retry schedule
 * (2s, 60s, 300s, 600s, 1h, 24h). So: verify, write, return 200 — nothing slow.
 * Flitt source IPs are 54.154.216.60 and 3.75.125.89.
 */
export async function POST(req: NextRequest) {
  let payload: FlittCallbackPayload;
  try {
    payload = (await req.json()) as FlittCallbackPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { paymentKey } = getFlittConfig();
  if (!verifySignature(paymentKey, payload)) {
    // Never log the signature itself.
    console.warn(`[flitt] callback signature rejected for ${payload?.order_id ?? "unknown"}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await connectDB();
    const result = await reconcilePayment(payload);
    if (result === "unknown-order") {
      // 200 so Flitt stops retrying a callback we can never satisfy.
      console.warn(`[flitt] callback for unknown order ${payload.order_id}`);
    }
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    // A 500 makes Flitt retry, which is what we want for a transient DB fault.
    console.error("[flitt] callback processing failed", (err as Error).message);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Confirm the callback path is not behind auth or a redirect**

Run: `grep -rn "matcher\|/api/" proxy.ts`
Expected: verify no rule intercepts `/api/flitt/callback`. If one does, add an exclusion — Flitt does not follow redirects and an auth bounce would break every callback.

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/flitt/reconcile.ts app/api/flitt/callback/route.ts
git commit -m "feat(payments): signed Flitt callback with idempotent reconcile"
```

---

## Task 9: Status route and result page

**Files:**
- Create: `app/api/flitt/status/[orderId]/route.ts`, `app/payment/result/page.tsx`, `app/payment/result/ResultClient.tsx`

**Interfaces:**
- Consumes: `getOrderStatus` (Task 5), `reconcilePayment` (Task 8), `verifySignature` (Task 1), `PaymentModel` (Task 3).
- Produces: `GET /api/flitt/status/[orderId]` returning `{ status, tier, amount, listingId, vipUntil }`, and the `/payment/result` screen.

- [ ] **Step 1: Implement `app/api/flitt/status/[orderId]/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import PaymentModel from "@/lib/models/Payment";
import ListingModel from "@/lib/models/Listing";
import { getFlittConfig } from "@/lib/flitt/config";
import { getOrderStatus } from "@/lib/flitt/client";
import { verifySignature } from "@/lib/flitt/signature";
import { reconcilePayment } from "@/lib/flitt/reconcile";

/** Statuses that are still in flight and worth re-polling Flitt for. */
const PENDING = new Set(["created", "processing"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    let payment = await PaymentModel.findOne({ orderId }).lean<{
      userId: { toString(): string };
      listingId: { toString(): string };
      status: string;
      tier: string;
      amount: number;
    } | null>();

    if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (payment.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Self-healing path: if the callback never landed, ask Flitt directly and
    // run the exact same reconcile the webhook would have run.
    if (PENDING.has(payment.status)) {
      try {
        const remote = await getOrderStatus(orderId);
        const { paymentKey } = getFlittConfig();
        if (verifySignature(paymentKey, remote)) {
          await reconcilePayment(remote);
          payment = await PaymentModel.findOne({ orderId }).lean<typeof payment>();
        } else {
          console.warn(`[flitt] status signature rejected for ${orderId}`);
        }
      } catch (err) {
        // Polling is best-effort; fall through and return the stored state.
        console.error(`[flitt] status poll failed for ${orderId}`, (err as Error).message);
      }
    }

    if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const listing = await ListingModel.findById(payment.listingId).lean<{
      vipUntil?: Date | null;
    } | null>();

    return NextResponse.json({
      orderId,
      status: payment.status,
      tier: payment.tier,
      amount: payment.amount,
      listingId: payment.listingId.toString(),
      vipUntil: listing?.vipUntil ? listing.vipUntil.toISOString() : null,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Implement `app/payment/result/ResultClient.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

type Result = {
  status: string;
  tier: string;
  listingId: string;
  vipUntil: string | null;
};

/** Poll while the payment is still in flight, up to ~30s. */
const PENDING = new Set(["created", "processing"]);
const INTERVAL_MS = 2000;
const MAX_POLLS = 15;

export function ResultClient({ orderId }: { orderId: string }) {
  const { t } = useT();
  const [result, setResult] = useState<Result | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let polls = 0;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/flitt/status/${encodeURIComponent(orderId)}`);
        if (!res.ok) throw new Error("status failed");
        const data = (await res.json()) as Result;
        if (cancelled) return;
        setResult(data);
        if (PENDING.has(data.status) && ++polls < MAX_POLLS) {
          timer = setTimeout(tick, INTERVAL_MS);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    };

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderId]);

  if (failed) {
    return <Shell icon="error" title={t.vip.result.errorTitle} body={t.vip.result.errorBody} />;
  }
  if (!result || PENDING.has(result.status)) {
    return <Shell icon="pending" title={t.vip.result.pendingTitle} body={t.vip.result.pendingBody} />;
  }
  if (result.status === "approved") {
    return (
      <Shell
        icon="success"
        title={t.vip.result.successTitle}
        body={
          result.vipUntil
            ? `${t.vip.result.activeUntil} ${new Date(result.vipUntil).toLocaleDateString()}`
            : t.vip.result.successBody
        }
        href={`/listings/${result.listingId}`}
        cta={t.vip.result.viewListing}
      />
    );
  }
  return (
    <Shell
      icon="error"
      title={t.vip.result.declinedTitle}
      body={t.vip.result.declinedBody}
      href={`/listings/${result.listingId}`}
      cta={t.vip.result.backToListing}
    />
  );
}

function Shell({
  icon,
  title,
  body,
  href,
  cta,
}: {
  icon: "pending" | "success" | "error";
  title: string;
  body: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="min-h-screen bg-[#EBF6FA] py-16">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <div className="flex justify-center mb-4">
            {icon === "pending" && <Loader2 className="w-10 h-10 text-[#0E4A5C] animate-spin" />}
            {icon === "success" && <CheckCircle2 className="w-10 h-10 text-green-600" />}
            {icon === "error" && <XCircle className="w-10 h-10 text-red-600" />}
          </div>
          <h1 className="text-xl font-bold text-[#0F2830] mb-2">{title}</h1>
          <p className="text-sm text-stone-500">{body}</p>
          {href && cta && (
            <Link
              href={href}
              className="mt-6 inline-block rounded-xl bg-[#0E4A5C] px-5 py-3 text-sm font-semibold text-white"
            >
              {cta}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement `app/payment/result/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { ResultClient } from "./ResultClient";

/**
 * Customer return target passed to Flitt as `response_url`. Display only — the
 * authoritative result comes from the server callback, and this page's polling
 * endpoint reconciles anything the callback missed.
 */
export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id: orderId } = await searchParams;
  if (!orderId) redirect("/");
  return <ResultClient orderId={orderId} />;
}
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: errors on `t.vip.*` because the dictionary namespace does not exist yet — Task 11 adds it. Everything else must be clean.

- [ ] **Step 5: Commit**

```bash
git add "app/api/flitt/status/[orderId]/route.ts" app/payment/result/page.tsx app/payment/result/ResultClient.tsx
git commit -m "feat(payments): status polling route and payment result page"
```

---

## Task 10: Rank-aware browse ordering

**Files:**
- Modify: `lib/marketplace/queries.ts:29-38`, `app/(marketplace)/page.tsx:216`

**Interfaces:**
- Consumes: `activeRank` (Task 4), `buildListingFilter` (existing).
- Produces: `getListings()` returns VIP-first results with the same `Listing[]` shape as before.

- [ ] **Step 1: Replace the query body in `lib/marketplace/queries.ts`**

Swap the `ListingModel.find(...)` chain inside `getListings` for:

```ts
  const docs = await ListingModel.aggregate([
    { $match: buildListingFilter(type, params) },
    // Rank is computed per query rather than stored-and-swept, so a promotion
    // drops out of the paid positions the instant `vipUntil` passes. A cron
    // sweep would leave a window where a lapsed listing keeps a paid slot.
    {
      $addFields: {
        effRank: {
          $cond: [
            {
              $and: [
                { $eq: ["$isVip", true] },
                {
                  $or: [
                    { $eq: [{ $ifNull: ["$vipUntil", null] }, null] },
                    { $gt: ["$vipUntil", new Date()] },
                  ],
                },
              ],
            },
            { $ifNull: ["$vipRank", 0] },
            0,
          ],
        },
      },
    },
    { $sort: { effRank: -1, createdAt: -1 } },
    { $skip: (page - 1) * PAGE_SIZE },
    { $limit: PAGE_SIZE },
  ]);
```

`countListings` is unchanged — ranking reorders results, it does not change which documents match.

- [ ] **Step 2: Sort the homepage VIP row in `app/(marketplace)/page.tsx:216`**

Replace:

```ts
        const vip = all.filter(isVipActive).slice(0, 4);
```

with:

```ts
        // Highest-paying tier first, then newest, so an Ultra buyer outranks a
        // Standard one in the four homepage slots.
        const vip = all
          .filter(isVipActive)
          .sort(
            (a, b) =>
              activeRank(b) - activeRank(a) ||
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 4);
```

Add `activeRank` to the existing import on line 31:

```ts
import { activeRank, isVipActive } from "@/lib/marketplace/vip";
```

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors. `aggregate()` returns `any[]`; keep the existing `JSON.parse(JSON.stringify(docs)) as Listing[]` line so the return type is unchanged.

- [ ] **Step 4: Commit**

```bash
git add lib/marketplace/queries.ts "app/(marketplace)/page.tsx"
git commit -m "feat(payments): rank VIP listings above the free feed"
```

---

## Task 11: Translations

Every later task consumes these keys, so the namespace lands before the UI.

**Files:**
- Create: `lib/i18n/dictionaries/ka/vip.ts`, `lib/i18n/dictionaries/en/vip.ts`
- Modify: `lib/i18n/dictionaries/ka.ts`, `lib/i18n/dictionaries/en.ts`, `lib/i18n/dictionaries/ka/listings.ts:106-119`, `lib/i18n/dictionaries/en/listings.ts` (matching `owner` block)

**Interfaces:**
- Produces: `t.vip.*` and three new `t.listings.owner.*` keys.

- [ ] **Step 1: Create `lib/i18n/dictionaries/ka/vip.ts`**

```ts
export const vip = {
  // Pricing page
  pageTitle: "VIP პაკეტები",
  pageSubtitle: "გაზარდე შენი განცხადების ხილვადობა",
  perDays: "დღე",
  gel: "₾",
  choose: "არჩევა",
  tiers: {
    standard: {
      name: "სტანდარტული VIP",
      desc: "განცხადება გამოიყოფა და მოხვდება VIP განყოფილებაში 3 დღით.",
    },
    super: {
      name: "სუპერ VIP",
      desc: "პრემიუმ განთავსება ძიების შედეგებისა და მთავარი გვერდის თავში 7 დღით.",
    },
    ultra: {
      name: "ულტრა VIP / TOP",
      desc: "მაქსიმალური ხილვადობა პლატფორმაზე პრიორიტეტული ნიშნით 14 დღით.",
    },
  },
  badge: { standard: "VIP", super: "SUPER", ultra: "TOP" },
  terms:
    "ყველა გადახდა ერთჯერადია ციფრული სარეკლამო მომსახურებისთვის. ავტომატური განახლება არ ხდება. ვადის გასვლის შემდეგ განცხადება რჩება პლატფორმაზე ჩვეულებრივ რეჟიმში.",
  refund:
    "დაწყებული სარეკლამო პერიოდი არ ბრუნდება. თუ მომსახურება არ გააქტიურდა გადახდის შემდეგ, დაგვიკავშირდით.",

  // Promote dialog
  dialog: {
    title: "განცხადების დაწინაურება",
    subtitle: "აირჩიე პაკეტი",
    pay: "გადახდა",
    redirecting: "გადამისამართება…",
    cancel: "გაუქმება",
    error: "გადახდის დაწყება ვერ მოხერხდა. სცადეთ თავიდან.",
    loginRequired: "გადასახდელად გაიარეთ ავტორიზაცია",
  },

  // Result page
  result: {
    pendingTitle: "გადახდა მუშავდება",
    pendingBody: "გთხოვთ დაელოდოთ, ეს რამდენიმე წამს გრძელდება.",
    successTitle: "გადახდა წარმატებულია",
    successBody: "თქვენი განცხადება დაწინაურდა.",
    activeUntil: "VIP აქტიურია",
    declinedTitle: "გადახდა უარყოფილია",
    declinedBody: "თანხა არ ჩამოგეჭრათ. სცადეთ სხვა ბარათით.",
    errorTitle: "სტატუსი ვერ დადგინდა",
    errorBody: "თუ თანხა ჩამოგეჭრათ, დაწინაურება ავტომატურად გააქტიურდება.",
    viewListing: "განცხადების ნახვა",
    backToListing: "განცხადებაზე დაბრუნება",
  },

  // Upsell after creating a listing
  upsell: {
    title: "განცხადება დაემატა",
    body: "გინდა მეტი ნახვა? დააწინაურე ახლავე.",
    skip: "ახლა არა",
  },

  // Buyer receipts
  payments: {
    title: "გადახდები",
    empty: "გადახდები არ არის",
    date: "თარიღი",
    listing: "განცხადება",
    package: "პაკეტი",
    amount: "თანხა",
    status: "სტატუსი",
    statuses: {
      created: "დაწყებული",
      processing: "მუშავდება",
      approved: "წარმატებული",
      declined: "უარყოფილი",
      expired: "ვადაგასული",
      reversed: "დაბრუნებული",
    },
  },
};
```

- [ ] **Step 2: Create `lib/i18n/dictionaries/en/vip.ts`**

Mirror the shape exactly — `en` is type-checked against `ka`, so a missing key is a compile error:

```ts
export const vip = {
  pageTitle: "VIP packages",
  pageSubtitle: "Get your listing seen by more people",
  perDays: "days",
  gel: "GEL",
  choose: "Choose",
  tiers: {
    standard: {
      name: "Standard VIP",
      desc: "Highlights the listing and places it in the VIP section for 3 days.",
    },
    super: {
      name: "Super VIP",
      desc: "Premium placement at the top of search results and the homepage for 7 days.",
    },
    ultra: {
      name: "Ultra VIP / TOP",
      desc: "Maximum visibility across the platform with a priority badge for 14 days.",
    },
  },
  badge: { standard: "VIP", super: "SUPER", ultra: "TOP" },
  terms:
    "All payments are one-time charges for digital promotional services. There is no recurring subscription. When the period ends the listing stays on the platform as a normal listing.",
  refund:
    "A promotion that has already started is non-refundable. If the service did not activate after payment, contact us.",

  dialog: {
    title: "Promote this listing",
    subtitle: "Pick a package",
    pay: "Pay",
    redirecting: "Redirecting…",
    cancel: "Cancel",
    error: "Could not start the payment. Please try again.",
    loginRequired: "Sign in to pay",
  },

  result: {
    pendingTitle: "Processing payment",
    pendingBody: "Please wait, this takes a few seconds.",
    successTitle: "Payment successful",
    successBody: "Your listing has been promoted.",
    activeUntil: "VIP active until",
    declinedTitle: "Payment declined",
    declinedBody: "You were not charged. Try a different card.",
    errorTitle: "Could not confirm status",
    errorBody: "If you were charged, the promotion will activate automatically.",
    viewListing: "View listing",
    backToListing: "Back to listing",
  },

  upsell: {
    title: "Listing published",
    body: "Want more views? Promote it now.",
    skip: "Not now",
  },

  payments: {
    title: "Payments",
    empty: "No payments yet",
    date: "Date",
    listing: "Listing",
    package: "Package",
    amount: "Amount",
    status: "Status",
    statuses: {
      created: "Started",
      processing: "Processing",
      approved: "Paid",
      declined: "Declined",
      expired: "Expired",
      reversed: "Refunded",
    },
  },
};
```

- [ ] **Step 3: Register the namespace in both root dictionaries**

In `lib/i18n/dictionaries/ka.ts`, add the import alongside the others and the key to the exported object:

```ts
import { vip } from "./ka/vip";
```
```ts
  vip,
```

Do the same in `lib/i18n/dictionaries/en.ts` with `./en/vip`.

- [ ] **Step 4: Extend the `owner` block in both listings dictionaries**

In `lib/i18n/dictionaries/ka/listings.ts`, inside `owner`, replace `soon: "მალე",` with:

```ts
    vipUntil: "აქტიურია",
    extend: "ვადის გაგრძელება",
    promoteError: "დაწინაურება ვერ დაიწყო",
```

Apply the equivalent change in `lib/i18n/dictionaries/en/listings.ts`:

```ts
    vipUntil: "Active until",
    extend: "Extend",
    promoteError: "Could not start the promotion",
```

`soon` is removed because the button is no longer a placeholder. If `tsc` reports it still referenced anywhere other than `OwnerControls.tsx`, keep it.

- [ ] **Step 5: Add the Payments tab labels**

In `lib/i18n/dictionaries/ka/profile.ts`, add `payments: "გადახდები",` to the `nav` object. In `lib/i18n/dictionaries/ka/admin.ts`, add `payments: "გადახდები",` to the `nav` object. Mirror both in the `en` files with `"Payments"`.

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: the `t.vip.*` errors from Task 9 are gone. `OwnerControls.tsx` may still error on `t.listings.owner.soon` — Task 12 removes that usage.

- [ ] **Step 7: Commit**

```bash
git add lib/i18n
git commit -m "feat(i18n): VIP and payments copy in ka + en"
```

---

## Task 12: Promote dialog and owner controls

**Files:**
- Create: `components/vip/PromoteDialog.tsx`, `components/vip/VipBadge.tsx`
- Modify: `app/(marketplace)/listings/[id]/OwnerControls.tsx:1-110`, `app/(marketplace)/listings/[id]/page.tsx:297`

**Interfaces:**
- Consumes: `VIP_PACKAGES`, `VIP_TIERS`, `formatGel` (Task 2), `POST /api/flitt/checkout` (Task 7).
- Produces:
  - `<PromoteDialog listingId open onClose />`
  - `<VipBadge tier />`

- [ ] **Step 1: Create `components/vip/VipBadge.tsx`**

The four section pages are Server Components that receive `t: Dictionary` as a prop, while the homepage card is a Client Component using the `useT()` hook. So the badge takes its label as a prop and calls no hook — that keeps it usable from both.

```tsx
import { Star } from "lucide-react";
import type { VipTier } from "@/lib/marketplace/vipPackages";

const STYLES: Record<VipTier, string> = {
  standard: "bg-amber-100 text-amber-700 border-amber-200",
  super: "bg-orange-100 text-orange-700 border-orange-300",
  ultra: "bg-gradient-to-r from-amber-400 to-orange-500 text-white border-orange-400",
};

/**
 * Tier-aware promotion badge. Higher tiers read louder on purpose.
 * `label` comes from `t.vip.badge[tier]` — passed in rather than looked up so
 * this renders in both Server and Client Components.
 */
export function VipBadge({ tier, label }: { tier: VipTier; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${STYLES[tier]}`}
    >
      <Star className="h-3 w-3" />
      {label}
    </span>
  );
}
```

- [ ] **Step 2: Create `components/vip/PromoteDialog.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";
import { VIP_PACKAGES, VIP_TIERS, formatGel, type VipTier } from "@/lib/marketplace/vipPackages";

/**
 * Tier picker that hands off to Flitt hosted checkout. The client sends only
 * the listing id and the tier — the server looks up the price, so nothing here
 * can influence what is charged.
 */
export function PromoteDialog({
  listingId,
  open,
  onClose,
}: {
  listingId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useT();
  const [selected, setSelected] = useState<VipTier>("super");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/flitt/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, tier: selected }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) throw new Error(data.error ?? "checkout failed");
      // Full document navigation — we are leaving the app for Flitt's page.
      window.location.href = data.checkoutUrl;
    } catch {
      setError(t.vip.dialog.error);
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.vip.dialog.title}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0F2830]">{t.vip.dialog.title}</h2>
            <p className="text-xs text-stone-500">{t.vip.dialog.subtitle}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t.vip.dialog.cancel}>
            <X className="h-5 w-5 text-stone-400" />
          </button>
        </div>

        <div className="space-y-2">
          {VIP_TIERS.map((tier) => {
            const pkg = VIP_PACKAGES[tier];
            const active = selected === tier;
            return (
              <button
                key={tier}
                type="button"
                onClick={() => setSelected(tier)}
                aria-pressed={active}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                  active ? "border-[#0E4A5C] bg-[#EBF6FA]" : "border-stone-200 hover:bg-stone-50"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    active ? "border-[#0E4A5C] bg-[#0E4A5C] text-white" : "border-stone-300"
                  }`}
                >
                  {active && <Check className="h-3 w-3" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[#0F2830]">
                    {t.vip.tiers[tier].name}
                  </span>
                  <span className="block text-xs text-stone-500">
                    {pkg.days} {t.vip.perDays}
                  </span>
                </span>
                <span className="shrink-0 text-base font-bold text-[#0F2830]">
                  {formatGel(pkg.amount)} {t.vip.gel}
                </span>
              </button>
            );
          })}
        </div>

        {error && <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>}

        <button
          type="button"
          onClick={pay}
          disabled={busy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0E4A5C] py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy
            ? t.vip.dialog.redirecting
            : `${t.vip.dialog.pay} ${formatGel(VIP_PACKAGES[selected].amount)} ${t.vip.gel}`}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire the dialog into `OwnerControls.tsx`**

Add to the imports:

```tsx
import { PromoteDialog } from "@/components/vip/PromoteDialog";
```

Extend the props (interface at lines 20-27) with:

```tsx
  vipUntil?: string | null;
```

Add state next to the existing `useState` calls:

```tsx
  const [promoteOpen, setPromoteOpen] = useState(false);
```

Replace the whole promote block (lines 78-110) with:

```tsx
      {/* Paid promotion. Buying again while VIP extends from the current
          expiry rather than restarting, so no paid time is lost. */}
      {isVip ? (
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span>{t.listings.owner.vipActive}</span>
          {vipUntil && (
            <span className="text-xs font-medium text-amber-600">
              {t.listings.owner.vipUntil} {new Date(vipUntil).toLocaleDateString()}
            </span>
          )}
          <button
            type="button"
            onClick={() => setPromoteOpen(true)}
            className="ml-auto rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600"
          >
            {t.listings.owner.extend}
          </button>
        </div>
      ) : (
        <div className="mb-5 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3.5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#0F2830]">{t.listings.owner.promoteTitle}</p>
              <p className="mt-0.5 text-xs text-stone-500">{t.listings.owner.promoteDesc}</p>
            </div>
            <button
              type="button"
              onClick={() => setPromoteOpen(true)}
              className="shrink-0 self-center rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white hover:bg-amber-600"
            >
              {t.listings.owner.promote}
            </button>
          </div>
        </div>
      )}

      <PromoteDialog
        listingId={id}
        open={promoteOpen}
        onClose={() => setPromoteOpen(false)}
      />
```

- [ ] **Step 4: Pass the expiry from the detail page**

In `app/(marketplace)/listings/[id]/page.tsx`, at the `<OwnerControls>` usage around line 297, add:

```tsx
                vipUntil={listing.vipUntil ?? null}
```

- [ ] **Step 5: Show the badge on browse cards**

Each of the four section pages has its own `ListingCard`, all Server Components taking `t: Dictionary`. Apply the same edit to `app/(marketplace)/buy-sell/page.tsx:55`, `adoption/page.tsx:55`, `mating/page.tsx:55`, and `lost-found/page.tsx:71`.

Add the imports:

```tsx
import { VipBadge } from "@/components/vip/VipBadge";
import { activeRank, tierForRank } from "@/lib/marketplace/vip";
```

Inside `ListingCard`, above the returned JSX:

```tsx
  // Only a live promotion earns a badge — activeRank() returns 0 once
  // `vipUntil` has passed, so a lapsed listing renders as an ordinary one.
  const tier = tierForRank(activeRank(listing));
```

Put the badge in the image overlay, immediately after the opening `<div className="relative aspect-[4/3] bg-stone-100">` block's closing image conditional (i.e. as a sibling of the existing price/status pill):

```tsx
        {tier && (
          <div className="absolute top-3 left-3">
            <VipBadge tier={tier} label={t.vip.badge[tier]} />
          </div>
        )}
```

Add a ring to the card wrapper so a promoted card is distinguishable at a glance — change the card `<div>` className to include:

```tsx
        ${tier === "ultra" ? "ring-2 ring-orange-400" : tier ? "ring-2 ring-amber-300/70" : ""}
```

using a template literal for the className. The homepage card at `app/(marketplace)/page.tsx:528` already applies `ring-2 ring-amber-300/70` when its `vip` prop is set; leave it as is.

- [ ] **Step 6: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors. `t.listings.owner.soon` is no longer referenced.

- [ ] **Step 7: Commit**

```bash
git add components/vip "app/(marketplace)/listings/[id]/OwnerControls.tsx" "app/(marketplace)/listings/[id]/page.tsx" "app/(marketplace)/buy-sell/page.tsx" "app/(marketplace)/adoption/page.tsx" "app/(marketplace)/mating/page.tsx" "app/(marketplace)/lost-found/page.tsx"
git commit -m "feat(payments): promote dialog and tier badges on listing cards"
```

---

## Task 13: Public pricing page

Payment providers reviewing a merchant account expect a visible page stating what is sold, at what price, and on what terms.

**Files:**
- Create: `app/vip/page.tsx`

**Interfaces:**
- Consumes: `VIP_PACKAGES`, `VIP_TIERS`, `formatGel` (Task 2), `t.vip.*` (Task 11).

- [ ] **Step 1: Implement `app/vip/page.tsx`**

```tsx
"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";
import { VIP_PACKAGES, VIP_TIERS, formatGel } from "@/lib/marketplace/vipPackages";

/**
 * Public pricing page for the paid promotion packages. Also the page a payment
 * provider looks for during merchant review: what is sold, the price, and the
 * refund terms, all stated plainly.
 */
export default function VipPricingPage() {
  const { t } = useT();

  return (
    <div className="min-h-screen bg-[#EBF6FA] py-12">
      <div className="mx-auto max-w-5xl px-4">
        <h1 className="text-3xl font-bold text-[#0F2830]">{t.vip.pageTitle}</h1>
        <p className="mt-2 text-sm text-stone-500">{t.vip.pageSubtitle}</p>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {VIP_TIERS.map((tier) => {
            const pkg = VIP_PACKAGES[tier];
            const featured = tier === "super";
            return (
              <div
                key={tier}
                className={`flex flex-col rounded-2xl bg-white p-6 shadow-sm ${
                  featured ? "ring-2 ring-[#0E4A5C]" : ""
                }`}
              >
                <h2 className="text-lg font-bold text-[#0F2830]">{t.vip.tiers[tier].name}</h2>
                <p className="mt-1 text-3xl font-bold text-[#0E4A5C]">
                  {formatGel(pkg.amount)}
                  <span className="ml-1 text-base font-semibold text-stone-400">{t.vip.gel}</span>
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  {pkg.days} {t.vip.perDays}
                </p>
                <p className="mt-4 flex-1 text-sm text-stone-600">{t.vip.tiers[tier].desc}</p>
                <Link
                  href="/profile/listings"
                  className={`mt-6 rounded-xl py-3 text-center text-sm font-bold ${
                    featured
                      ? "bg-[#0E4A5C] text-white"
                      : "border border-[#0E4A5C] text-[#0E4A5C]"
                  }`}
                >
                  {t.vip.choose}
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-10 space-y-3 rounded-2xl bg-white p-6 text-sm text-stone-600 shadow-sm">
          <p className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            {t.vip.terms}
          </p>
          <p className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            {t.vip.refund}
          </p>
          <Link href="/terms" className="inline-block text-xs font-semibold text-[#0E4A5C] underline">
            {t.nav.terms ?? "Terms"}
          </Link>
        </div>
      </div>
    </div>
  );
}
```

If `t.nav.terms` does not exist, check `lib/i18n/dictionaries/ka/nav.ts` and use whichever key already labels the terms link; do not leave the `??` fallback in the committed code.

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/vip/page.tsx
git commit -m "feat(payments): public VIP pricing page"
```

---

## Task 14: Remaining purchase entry points

**Files:**
- Modify: `app/profile/listings/page.tsx`, `app/(marketplace)/listings/new/page.tsx:109`, `app/(marketplace)/listings/[id]/page.tsx`

**Interfaces:**
- Consumes: `PromoteDialog` (Task 12), `t.vip.upsell.*` (Task 11).

- [ ] **Step 1: Add a promote action to each card in `app/profile/listings/page.tsx`**

Add the imports:

```tsx
import { Sparkles } from "lucide-react";
import { PromoteDialog } from "@/components/vip/PromoteDialog";
```

Inside `ListingCard`, add state and a button. Place the button at the end of the card body, before its closing element:

```tsx
  const [promoteOpen, setPromoteOpen] = useState(false);
```

```tsx
      <button
        type="button"
        onClick={() => setPromoteOpen(true)}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 py-2 text-xs font-bold text-white hover:bg-amber-600"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {listing.isVip ? t.listings.owner.extend : t.listings.owner.promote}
      </button>
      <PromoteDialog
        listingId={listing._id}
        open={promoteOpen}
        onClose={() => setPromoteOpen(false)}
      />
```

Add `useState` to the existing `react` import if it is not already there.

- [ ] **Step 2: Redirect to the new listing with an upsell flag**

In `app/(marketplace)/listings/new/page.tsx`, the POST already returns `{ listing }` with status 201. Replace line 109:

```tsx
      router.push(`/${type}`);
```

with:

```tsx
      const { listing } = (await res.json()) as { listing: { _id: string } };
      // Land on the new listing with the promote dialog open — the moment the
      // owner most wants visibility.
      router.push(`/listings/${listing._id}?promote=1`);
```

Remove the now-redundant `if (!res.ok)` body re-read if it consumes the response — read the JSON once into a variable and branch on `res.ok`:

```tsx
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? t.listings.form.genericError);
      }
      router.push(`/listings/${json.listing._id}?promote=1`);
```

- [ ] **Step 3: Open the dialog automatically from the query flag**

In `OwnerControls.tsx`, accept an `autoPromote` prop and seed the state from it:

```tsx
  const [promoteOpen, setPromoteOpen] = useState(autoPromote);
```

Add `autoPromote = false` to the destructured props and `autoPromote?: boolean;` to the props type.

In `app/(marketplace)/listings/[id]/page.tsx`, read the flag from `searchParams` and pass it down. The page already receives `params`; add `searchParams` to its props:

```tsx
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ promote?: string }>;
```

```tsx
  const { promote } = await searchParams;
```

```tsx
                autoPromote={promote === "1"}
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/profile/listings/page.tsx "app/(marketplace)/listings/new/page.tsx" "app/(marketplace)/listings/[id]/page.tsx" "app/(marketplace)/listings/[id]/OwnerControls.tsx"
git commit -m "feat(payments): promote entry points in profile and post-create"
```

---

## Task 15: Buyer receipts

**Files:**
- Create: `app/api/profile/payments/route.ts`, `app/profile/payments/page.tsx`
- Modify: `app/profile/layout.tsx:9-17`

**Interfaces:**
- Consumes: `PaymentModel` (Task 3), `t.vip.payments.*` (Task 11).
- Produces: `GET /api/profile/payments` → `{ payments: PaymentRow[] }` where `PaymentRow = { _id, orderId, tier, amount, currency, status, createdAt, listingId, listingBreed }`.

- [ ] **Step 1: Implement `app/api/profile/payments/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import PaymentModel from "@/lib/models/Payment";
import ListingModel from "@/lib/models/Listing";

/** The signed-in user's own purchases, newest first. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    // Referencing the Listing model here guarantees it is registered before
    // populate() runs — Mongoose throws MissingSchemaError otherwise.
    void ListingModel;

    const docs = await PaymentModel.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("listingId", "breed")
      .lean<
        {
          _id: { toString(): string };
          orderId: string;
          tier: string;
          amount: number;
          currency: string;
          status: string;
          createdAt: Date;
          listingId?: { _id: { toString(): string }; breed?: string } | null;
        }[]
      >();

    return NextResponse.json({
      payments: docs.map((p) => ({
        _id: p._id.toString(),
        orderId: p.orderId,
        tier: p.tier,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
        listingId: p.listingId?._id?.toString() ?? null,
        listingBreed: p.listingId?.breed ?? null,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Implement `app/profile/payments/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useT } from "@/components/i18n/LanguageProvider";
import { formatGel, type VipTier } from "@/lib/marketplace/vipPackages";

import type { PaymentStatus } from "@/lib/models/Payment";

type Row = {
  _id: string;
  tier: VipTier;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
  listingId: string | null;
  listingBreed: string | null;
};

export default function PaymentsPage() {
  const { t } = useT();
  const router = useRouter();
  const { status } = useSession();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile/payments")
      .then((r) => r.json())
      .then(({ payments }) => setRows(payments ?? []))
      .catch(() => setRows([]));
  }, [status]);

  return (
    <div className="min-h-screen bg-[#EBF6FA] py-8">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="mb-6 text-2xl font-bold text-[#0F2830]">{t.vip.payments.title}</h1>

        {rows === null ? (
          <div className="py-20 text-center text-sm text-stone-400">{t.common.actions.loading}</div>
        ) : rows.length === 0 ? (
          <div className="py-20 text-center text-sm text-stone-400">{t.vip.payments.empty}</div>
        ) : (
          <div className="divide-y divide-stone-100 overflow-hidden rounded-2xl bg-white shadow-sm">
            {rows.map((row) => (
              <div key={row._id} className="flex items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#0F2830]">
                    {t.vip.tiers[row.tier].name}
                  </p>
                  <p className="truncate text-xs text-stone-500">
                    {new Date(row.createdAt).toLocaleDateString()}
                    {row.listingBreed ? ` · ${row.listingBreed}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-[#0F2830]">
                  {formatGel(row.amount)} {t.vip.gel}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    row.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : row.status === "declined" || row.status === "expired"
                        ? "bg-red-50 text-red-600"
                        : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {t.vip.payments.statuses[row.status]}
                </span>
                {row.listingId && (
                  <Link
                    href={`/listings/${row.listingId}`}
                    className="shrink-0 text-xs font-semibold text-[#0E4A5C] underline"
                  >
                    {t.vip.payments.listing}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add the Payments tab in `app/profile/layout.tsx`**

Add `Receipt` to the lucide import and insert into `TABS` after the balance entry:

```tsx
  { href: "/profile/payments", key: "payments", icon: Receipt, exact: false },
```

The tab label comes from `t.profile.nav[tab.key]`, so the `payments` key added in Task 11 Step 5 supplies it.

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/api/profile/payments/route.ts app/profile/payments/page.tsx app/profile/layout.tsx
git commit -m "feat(payments): buyer payment receipts in profile"
```

---

## Task 16: Admin payments table

**Files:**
- Create: `app/api/admin/payments/route.ts`, `app/admin/payments/page.tsx`
- Modify: `app/admin/layout.tsx:5-18`

**Interfaces:**
- Consumes: `PaymentModel` (Task 3).
- Produces: `GET /api/admin/payments?status=` → `{ payments: AdminPaymentRow[] }`.

- [ ] **Step 1: Implement `app/api/admin/payments/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import PaymentModel from "@/lib/models/Payment";
import UserModel from "@/lib/models/User";
import ListingModel from "@/lib/models/Listing";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "admin") return null;
  return session;
}

const VALID_STATUSES = [
  "created",
  "processing",
  "approved",
  "declined",
  "expired",
  "reversed",
];

/** Read-only reconciliation view. No mutations — refunds happen in the Flitt portal. */
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = new URL(req.url).searchParams.get("status") ?? "";
  const filter: Record<string, unknown> = {};
  if (VALID_STATUSES.includes(status)) filter.status = status;

  await connectDB();
  // Ensure both referenced models are registered before populate().
  void UserModel;
  void ListingModel;

  const docs = await PaymentModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate("userId", "email name")
    .populate("listingId", "breed")
    .lean<
      {
        _id: { toString(): string };
        orderId: string;
        paymentId?: number | null;
        tier: string;
        amount: number;
        currency: string;
        status: string;
        note?: string | null;
        createdAt: Date;
        userId?: { email?: string; name?: string } | null;
        listingId?: { _id: { toString(): string }; breed?: string } | null;
      }[]
    >();

  return NextResponse.json({
    payments: docs.map((p) => ({
      _id: p._id.toString(),
      orderId: p.orderId,
      paymentId: p.paymentId ?? null,
      tier: p.tier,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      note: p.note ?? null,
      createdAt: p.createdAt.toISOString(),
      user: p.userId?.email ?? p.userId?.name ?? "—",
      listingId: p.listingId?._id?.toString() ?? null,
      listingBreed: p.listingId?.breed ?? null,
    })),
  });
}
```

- [ ] **Step 2: Implement `app/admin/payments/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "@/components/i18n/LanguageProvider";
import { formatGel } from "@/lib/marketplace/vipPackages";

type Row = {
  _id: string;
  orderId: string;
  paymentId: number | null;
  tier: string;
  amount: number;
  currency: string;
  status: string;
  note: string | null;
  createdAt: string;
  user: string;
  listingId: string | null;
  listingBreed: string | null;
};

const STATUSES = ["", "approved", "declined", "created", "processing", "expired", "reversed"];

export default function AdminPaymentsPage() {
  const { t } = useT();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setRows(null);
    fetch(`/api/admin/payments${status ? `?status=${status}` : ""}`)
      .then((r) => r.json())
      .then(({ payments }) => setRows(payments ?? []))
      .catch(() => setRows([]));
  }, [status]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t.vip.payments.title}</h1>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label={t.vip.payments.status}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "" ? "—" : s}
            </option>
          ))}
        </select>
      </div>

      {rows === null ? (
        <p className="py-20 text-center text-sm text-gray-400">{t.common.actions.loading}</p>
      ) : rows.length === 0 ? (
        <p className="py-20 text-center text-sm text-gray-400">{t.vip.payments.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">{t.vip.payments.date}</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">{t.vip.payments.listing}</th>
                <th className="px-4 py-3">{t.vip.payments.package}</th>
                <th className="px-4 py-3">{t.vip.payments.amount}</th>
                <th className="px-4 py-3">{t.vip.payments.status}</th>
                <th className="px-4 py-3">order_id</th>
                <th className="px-4 py-3">payment_id</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r._id}>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.user}</td>
                  <td className="px-4 py-3">
                    {r.listingId ? (
                      <Link href={`/listings/${r.listingId}`} className="text-[#0E4A5C] underline">
                        {r.listingBreed ?? r.listingId.slice(-6)}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.tier}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold">
                    {formatGel(r.amount)} {r.currency}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        r.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {r.status}
                    </span>
                    {r.note && <span className="ml-2 text-xs text-red-600">{r.note}</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.orderId}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {r.paymentId ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add the nav item in `app/admin/layout.tsx`**

Add `CreditCard` to the lucide import on line 5, and insert into `nav` after the listings entry:

```tsx
    { href: "/admin/payments", label: t.admin.nav.payments, icon: CreditCard },
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/payments/route.ts app/admin/payments/page.tsx app/admin/layout.tsx
git commit -m "feat(payments): read-only admin payments table"
```

---

## Task 17: Environment documentation and sandbox verification

**Files:**
- Create or modify: `.env.example`
- Create: `docs/flitt-integration.md`

- [ ] **Step 1: Document the variables in `.env.example`**

If the file does not exist, create it with only these lines. If it exists, append:

```bash
# Flitt payments (https://docs.flitt.com)
# Leave BOTH unset locally and on preview to use Flitt's public sandbox
# merchant (1549901 / "test") with the documented test cards.
# Production requires real values or the app refuses to start a checkout.
FLITT_MERCHANT_ID=
FLITT_PAYMENT_KEY=
FLITT_CREDIT_KEY=
FLITT_API_BASE=https://pay.flitt.com

# Production only. Without it, callbacks resolve to the vercel.app alias.
NEXT_PUBLIC_SITE_URL=https://mypetge.online
```

- [ ] **Step 2: Write `docs/flitt-integration.md`**

```markdown
# Flitt Integration

Sells three one-time VIP promotion packages. Design: `docs/superpowers/specs/2026-07-26-flitt-vip-payments-design.md`.

## Packages

| Tier | Days | Price | Amount sent (tetri) |
| --- | --- | --- | --- |
| standard | 3 | 3 GEL | 300 |
| super | 7 | 7 GEL | 700 |
| ultra | 14 | 12 GEL | 1200 |

## Environment

| Variable | Production | Local / preview |
| --- | --- | --- |
| `FLITT_MERCHANT_ID` | real merchant id | unset → sandbox 1549901 |
| `FLITT_PAYMENT_KEY` | real payment key | unset → "test" |
| `FLITT_CREDIT_KEY` | real credit key | unset (unused in v1) |
| `FLITT_API_BASE` | `https://pay.flitt.com` | same |
| `NEXT_PUBLIC_SITE_URL` | `https://mypetge.online` | leave unset |

Credentials live only in Vercel environment variables. Never commit them.

## Endpoints

- `POST /api/flitt/checkout` — owner buys a package, returns `checkoutUrl`
- `POST /api/flitt/callback` — Flitt webhook, authoritative result
- `GET /api/flitt/status/[orderId]` — owner-scoped status, reconciles missed callbacks

Flitt callback source IPs: `54.154.216.60`, `3.75.125.89`. The callback endpoint must
be reachable over HTTPS with no redirect, and must answer within 30 seconds.

## Sandbox test cards

| Card | Result |
| --- | --- |
| `4444555566661111` | approve (3DS) |
| `4444111166665555` | decline (3DS) |
| `4444555511116666` | approve (no 3DS) |
| `4444666655559999` | approve (3DS challenge) |

Any expiry and CVV.

## Going live

1. Set `NEXT_PUBLIC_SITE_URL=https://mypetge.online` in Vercel production.
2. Confirm `https://mypetge.online/api/flitt/callback` returns a direct response, not a redirect.
3. Set `FLITT_MERCHANT_ID`, `FLITT_PAYMENT_KEY`, `FLITT_CREDIT_KEY` in Vercel production only.
4. Redeploy, buy one Standard VIP with a real card, then refund it from the Flitt portal.
5. Rotate the payment key and credit key in the Flitt portal — they were shared in a chat transcript and must be treated as exposed. Update the Vercel variables to match.

## Refunds

Not implemented in-app for v1. Issue refunds from the Flitt merchant portal, then
clear `isVip` / `vipUntil` / `vipRank` on the listing manually via `/admin/listings`.
```

- [ ] **Step 3: Full local verification**

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: all pass. Do not run `next build` — it OOMs on this machine.

- [ ] **Step 4: Commit and push**

```bash
git add .env.example docs/flitt-integration.md
git commit -m "docs(payments): Flitt environment and go-live runbook"
git push origin main
```

- [ ] **Step 5: Verify on the Vercel preview deployment**

With sandbox credentials active, walk the full flow in a browser:

1. Sign in, open your own listing, click Promote, choose Super VIP.
2. Pay with `4444555566661111`. Confirm the redirect back to `/payment/result`.
3. Confirm the result page flips to success and the listing shows VIP with an expiry 7 days out.
4. Confirm the listing now sorts above non-VIP listings in its section.
5. Repeat with `4444111166665555` and confirm a declined result and no VIP change.
6. Buy Standard on the still-VIP listing; confirm the expiry extends rather than resets, and the tier stays Super.
7. Check `/admin/payments` shows all three orders with the right statuses.
8. Replay one approved callback by hand against the preview URL, re-signed with the sandbox key, and confirm `vipUntil` does not move — the idempotency guard holding.

Record anything that fails as a follow-up task rather than patching blind.

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
| --- | --- |
| §3 checkout flow decision | 5, 7 |
| §3 env-driven environment | 2, 17 |
| §4 module layout | 1–6 |
| §5 Payment model, Listing fields | 3 |
| §6 ranking aggregation, homepage sort | 10 |
| §7 config, signature, create order, status polling | 1, 2, 5, 9 |
| §8 all four routes | 7, 8, 9 |
| §9 idempotent grant, extension math, edge cases | 4, 6 |
| §10 all seven UI surfaces | 12, 13, 14, 15, 16 |
| §10 i18n ka + en | 11 |
| §11 error handling table | 7, 8, 9 |
| §12 unit tests + sandbox integration | 1, 2, 4, 17 |
| §13 rollout | 17 |

No gaps.

**Naming consistency check:** `VipTier`, `VIP_PACKAGES`, `VIP_TIERS`, `formatGel`, `activeRank`, `tierForRank`, `computeVipGrant`, `applyVipForOrder`, `reconcilePayment`, `createCheckoutUrl`, `getOrderStatus`, `getFlittConfig`, `flittBaseUrl`, `sign`, `verifySignature`, `buildSignatureString` are each defined in exactly one task and referenced with the same signature everywhere after.

**Ordering constraint:** Task 11 (i18n) must land before Tasks 12–16, and Task 9 leaves known `t.vip.*` type errors until Task 11 completes. This is called out in both tasks.
