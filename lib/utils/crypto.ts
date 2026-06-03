import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, storedHash] = stored.split(":");
  if (!salt || !storedHash) return false;
  const hash = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}
