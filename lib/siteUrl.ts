/**
 * Canonical, absolute site origin (no trailing slash). Used for SEO metadata,
 * the sitemap and robots. Resolution order:
 *   1. NEXT_PUBLIC_SITE_URL — explicit override (set this in prod if the domain
 *      ever changes).
 *   2. VERCEL_PROJECT_PRODUCTION_URL — the stable production alias Vercel injects
 *      (host only, so we prepend https://).
 *   3. The known production domain as a last-resort fallback.
 *
 * NOTE: NEXT_PUBLIC_APP_URL is intentionally NOT used here — locally it points at
 * http://localhost:3000, which must never leak into canonical URLs / sitemaps.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://my-pet-self.vercel.app")
).replace(/\/$/, "");
