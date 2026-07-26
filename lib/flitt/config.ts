import { SITE_URL } from "@/lib/siteUrl";

/** Flitt's public sandbox merchant — safe defaults outside production. */
const SANDBOX_MERCHANT_ID = 1549901;
const SANDBOX_PAYMENT_KEY = "test";

export interface FlittConfig {
  merchantId: number;
  paymentKey: string;
  apiBase: string;
  isSandbox: boolean;
}

/**
 * Merchant credentials from env. Production must configure real ones — falling
 * back to the sandbox merchant there would take a customer's money into an
 * account we do not control, so it throws instead.
 */
export function getFlittConfig(): FlittConfig {
  const rawId = process.env.FLITT_MERCHANT_ID;
  const key = process.env.FLITT_PAYMENT_KEY;
  const apiBase = (process.env.FLITT_API_BASE ?? "https://pay.flitt.com").replace(/\/$/, "");

  if (rawId && key) {
    const merchantId = Number(rawId);
    if (!Number.isInteger(merchantId)) {
      throw new Error("FLITT_MERCHANT_ID must be an integer");
    }
    return {
      merchantId,
      paymentKey: key,
      apiBase,
      isSandbox: merchantId === SANDBOX_MERCHANT_ID,
    };
  }

  if (process.env.VERCEL_ENV === "production") {
    throw new Error("FLITT_MERCHANT_ID and FLITT_PAYMENT_KEY are required in production");
  }

  return {
    merchantId: SANDBOX_MERCHANT_ID,
    paymentKey: SANDBOX_PAYMENT_KEY,
    apiBase,
    isSandbox: true,
  };
}

/**
 * Whether real credentials are present, without throwing.
 *
 * `getFlittConfig()` deliberately throws in production when credentials are
 * missing, so callers that run before a payment exists must check this first
 * and answer with a clean status instead of an unhandled 500.
 */
export function isFlittConfigured(): boolean {
  if (process.env.FLITT_MERCHANT_ID && process.env.FLITT_PAYMENT_KEY) return true;
  return process.env.VERCEL_ENV !== "production";
}

/**
 * Origin Flitt should call back to.
 *
 * `lib/siteUrl.ts` is deliberately not reused as-is: its fallback is the stable
 * production alias, which would make a preview deployment send callbacks to
 * production and grant VIP against production data. `server_callback_url` is a
 * per-request parameter, not a portal-registered value, so a rotating preview
 * host is fine.
 */
export function flittBaseUrl(): string {
  if (process.env.VERCEL_ENV === "production") return SITE_URL;
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
