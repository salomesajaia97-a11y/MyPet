import { pbkdf2, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const pbkdf2Async = promisify(pbkdf2);

// OWASP-recommended minimum for PBKDF2-HMAC-SHA512. The iteration count is
// stored in the hash string so existing (weaker) hashes still verify and only
// new/changed passwords get the stronger cost.
const ITERATIONS = 210_000;
const KEYLEN = 64;
const DIGEST = "sha512";

// Legacy hashes were stored as `salt:hash` with this fixed iteration count.
const LEGACY_ITERATIONS = 1000;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await pbkdf2Async(password, salt, ITERATIONS, KEYLEN, DIGEST)).toString("hex");
  return `${ITERATIONS}:${salt}:${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");

  // New format: `iterations:salt:hash`. Legacy format: `salt:hash`.
  let iterations: number, salt: string, storedHash: string;
  if (parts.length === 3) {
    iterations = Number(parts[0]);
    salt = parts[1];
    storedHash = parts[2];
  } else if (parts.length === 2) {
    iterations = LEGACY_ITERATIONS;
    salt = parts[0];
    storedHash = parts[1];
  } else {
    return false;
  }

  if (!salt || !storedHash || !Number.isInteger(iterations)) return false;

  const hash = (await pbkdf2Async(password, salt, iterations, KEYLEN, DIGEST)).toString("hex");
  try {
    return timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
  } catch {
    return false;
  }
}
