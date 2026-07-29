import { after } from "next/server";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * IndexNow — push a URL to search engines the moment it changes.
 *
 * A sitemap tells a crawler what exists; it does not make anyone come and look.
 * On a small young site the gap between publishing a listing and being crawled
 * can be days, which is most of a classified's useful life. IndexNow closes it
 * to minutes for Bing, Yandex and Seznam from a single POST, with no account and
 * no OAuth. Bing is also the index ChatGPT search and Copilot read, so this is
 * as much about being citable by an answer engine as about search.
 *
 * Google does not participate — for Google the route is the sitemap plus Search
 * Console (see docs/search-console.md).
 */

/** Where the key file is served from, and the value engines fetch to verify. */
export const INDEXNOW_KEY_PATH = "/indexnow-key.txt";

const ENDPOINT = "https://api.indexnow.org/indexnow";

/**
 * The shared secret proving we control the host. Absent = feature off, which is
 * the correct default for local work and preview deployments.
 */
export function indexNowKey(): string | null {
  const key = process.env.INDEXNOW_KEY?.trim();
  return key ? key : null;
}

/**
 * Build the submission body, or null when the request should not be made.
 *
 * Pure so the rules are testable: paths become absolute URLs on the canonical
 * host, blanks and duplicates are dropped, and an empty list is not submitted.
 * IndexNow accepts at most 10,000 URLs per request — far above anything a single
 * mutation produces, but the slice keeps a future bulk caller honest.
 */
export function indexNowPayload(
  paths: string[],
  key: string | null
): { host: string; key: string; keyLocation: string; urlList: string[] } | null {
  if (!key) return null;

  const seen = new Set<string>();
  for (const path of paths) {
    const trimmed = path?.trim();
    if (!trimmed) continue;
    seen.add(trimmed.startsWith("http") ? trimmed : `${SITE_URL}${trimmed}`);
  }
  if (seen.size === 0) return null;

  return {
    host: new URL(SITE_URL).host,
    key,
    keyLocation: `${SITE_URL}${INDEXNOW_KEY_PATH}`,
    urlList: [...seen].slice(0, 10_000),
  };
}

/**
 * True only in a real production deployment.
 *
 * `SITE_URL` falls back to the production alias, so a preview build would
 * otherwise submit production URLs on every test mutation — and a local `npm
 * run start` would too. Both would be someone else's crawl budget.
 */
function isLiveDeployment(): boolean {
  return process.env.VERCEL_ENV === "production";
}

/**
 * Submit paths to IndexNow after the response has been sent.
 *
 * Scheduled with `after()` so a slow or unreachable endpoint never adds latency
 * to the user's create/edit/delete, and never fails it: SEO housekeeping must
 * not be able to turn a successful mutation into an error. Failures are
 * swallowed on purpose — the sitemap is still the durable index.
 */
export function submitToIndexNow(paths: string[]): void {
  if (!isLiveDeployment()) return;
  const payload = indexNowPayload(paths, indexNowKey());
  if (!payload) return;

  after(async () => {
    try {
      await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
        // The endpoint answers in well under a second when it is healthy;
        // anything slower is not worth holding a function open for.
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      // Deliberately silent.
    }
  });
}
