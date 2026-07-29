/**
 * Tidy the description of a directory entry.
 *
 * The OpenStreetMap import left most rows with a stub rather than a sentence:
 * 66 of the 91 live entries end in a dangling separator, e.g. `"ზოომაღაზია — "`,
 * where the text after the dash was never scraped. Rendered as-is it reads like
 * a broken page, and it is what Google and any answer engine quote as the
 * description of the business.
 *
 * Cleaning it at render rather than in the database keeps the original row
 * intact, so a later re-import or a manual edit is not fighting a migration.
 */

/**
 * Separators a truncated scrape tends to end (or start) on.
 *
 * Dashes, bullets and pipes only. A trailing colon or comma is left alone —
 * "სერვისები:" introduces the list on the next line, and stripping it would
 * damage a description that is not broken at all.
 */
const EDGE_SEPARATORS = /^[\s–—\-·•|]+|[\s–—\-·•|]+$/g;

/**
 * Returns the description with dangling separators removed, or null when
 * nothing meaningful is left — so callers can fall back instead of rendering an
 * empty "Description" heading.
 */
export function tidyDescription(raw?: string | null): string | null {
  if (!raw) return null;
  // Collapse runs of blank lines but keep single newlines: the field is
  // rendered with `whitespace-pre-line` and some entries are genuinely a list.
  const cleaned = raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(EDGE_SEPARATORS, ""))
    .filter((line, i, lines) => line !== "" || (i > 0 && lines[i - 1] !== ""))
    .join("\n")
    .replace(EDGE_SEPARATORS, "");

  return cleaned ? cleaned : null;
}
