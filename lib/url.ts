/**
 * Normalize a user-supplied external link, or return null if it cannot be
 * trusted in an `href`.
 *
 * A business's `website` is free text that gets rendered straight into an
 * anchor on the services card and detail page. Without a scheme check a
 * submitter could store `javascript:…` and have it run in the browser of
 * anyone who clicks through — the same stored-XSS shape review photos had.
 * Only http and https survive; javascript:, data:, vbscript:, file: and
 * anything unparseable are refused.
 *
 * A bare host like "vet.ge" is accepted and returned as "https://vet.ge/",
 * because that is how people actually type a website into a form.
 */
export function safeExternalUrl(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Scheme-less input gets https rather than a rejection. The test is for a
  // scheme specifically, so "javascript:alert(1)" cannot slip through as a
  // hostname and then be prefixed into something harmless-looking.
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed);
  const candidate = hasScheme ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!url.hostname) return null;
  return url.toString();
}

/**
 * Coerce the optional `website` field for storage: absent or blank keeps it
 * unset, anything present has to survive the scheme check, and "invalid" tells
 * the caller to answer 400 rather than silently dropping what was typed.
 */
export function normalizeWebsite(input: unknown): string | undefined | "invalid" {
  if (input === undefined || input === null || input === "") return undefined;
  return safeExternalUrl(input) ?? "invalid";
}
