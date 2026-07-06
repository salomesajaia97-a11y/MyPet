import { NextResponse } from "next/server";

// Simple fixed-window, in-memory rate limiter. Good enough for a single-instance
// deployment / local dev. (A multi-instance deploy would need a shared store
// like Upstash Redis — swap this module out then.)
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** Best-effort client identifier for unauthenticated endpoints. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Returns a 429 response if `key` has exceeded `limit` hits within `windowMs`,
 * otherwise null (request may proceed). Callers namespace the key, e.g.
 * `reviews:<userId>`.
 */
export function rateLimit(key: string, limit: number, windowMs: number): NextResponse | null {
  const now = Date.now();
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
