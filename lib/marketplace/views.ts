import { createHmac } from "node:crypto";
import type { Locale } from "@/lib/i18n";

/**
 * Public short form of a listing id — the first 6 hex characters of the Mongo
 * ObjectId, the way classifieds print a reference number people can read out
 * over the phone. Leaks nothing: the full id is already in the URL.
 */
export function shortListingId(id: string): string {
  return id.slice(0, 6);
}

/** Publication date in the reader's locale, e.g. "16 მაი. 2026" / "May 16, 2026". */
export function formatPublishedDate(iso: string | Date, locale: Locale): string {
  return new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "ka-GE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Calendar day in Tbilisi as YYYY-MM-DD. The "one view per visitor per day"
 * window has to roll over at local midnight — UTC would flip it at 4am for
 * everyone actually using the site.
 */
export function tbilisiDayStamp(at: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD, which sorts and compares as a plain string.
  return at.toLocaleDateString("en-CA", { timeZone: "Asia/Tbilisi" });
}

/**
 * Opaque per-(listing, visitor, day) fingerprint used to count a view at most
 * once a day. HMAC'd rather than stored raw so the collection never holds an IP
 * or a user agent — only a digest that cannot be reversed without the secret.
 */
export function viewDedupeKey(input: {
  listingId: string;
  ip: string;
  userAgent: string;
  day: string;
  secret: string;
}): string {
  return createHmac("sha256", input.secret)
    .update(`${input.listingId}|${input.ip}|${input.userAgent}|${input.day}`)
    .digest("hex");
}
