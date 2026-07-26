import { createHash, timingSafeEqual } from "node:crypto";
import type { FlittParams } from "./types";

/** Never part of the hashed parameter set — see docs.flitt.com/api/building-signature. */
const EXCLUDED = new Set(["signature", "response_signature_string"]);

/**
 * Build the pre-hash string: `secret|<non-empty values, sorted by key>`.
 *
 * Four rules Flitt is strict about and that are easy to get wrong: empty/null
 * values are dropped along with their separator, numeric `0` is kept as "0",
 * keys sort alphabetically rather than by insertion order, and the string is
 * hashed as UTF-8 so Georgian `order_desc` values work.
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
