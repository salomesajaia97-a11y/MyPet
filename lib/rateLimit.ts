import { NextResponse } from "next/server";

// Simple fixed-window, in-memory rate limiter. Good enough for a single-instance
// deployment / local dev. (A multi-instance deploy would need a shared store
// like Upstash Redis — swap this module out then.)
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
let lastSweep = 0;

// Drop expired buckets so the Map doesn't grow unboundedly with one entry per
// distinct IP/user key. Runs at most once per minute, amortized over calls.
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    if (now >= b.resetAt) buckets.delete(key);
  }
}

/**
 * Best-effort client identifier for unauthenticated endpoints. Prefers the
 * platform-set header (Vercel's `x-vercel-forwarded-for`, then `x-real-ip`)
 * over raw `x-forwarded-for`, whose first hop is client-supplied and spoofable.
 */
export function clientIp(req: Request): string {
  const vercel = req.headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}

/**
 * Returns a 429 response if `key` has exceeded `limit` hits within `windowMs`,
 * otherwise null (request may proceed). Callers namespace the key, e.g.
 * `reviews:<userId>`.
 */
export function rateLimit(key: string, limit: number, windowMs: number): NextResponse | null {
  const now = Date.now();
  sweep(now);
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (bucket.count >= limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  bucket.count++;
  return null;
}
