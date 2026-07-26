import { getFlittConfig } from "./config";
import { sign } from "./signature";
import type { FlittCallbackPayload, FlittParams } from "./types";

export class FlittError extends Error {
  code?: number;
  constructor(message: string, code?: number) {
    super(message);
    this.name = "FlittError";
    this.code = code;
  }
}

export interface CheckoutInput {
  orderId: string;
  amount: number; // tetri
  orderDesc: string;
  serverCallbackUrl: string;
  responseUrl: string;
  lang: "ka" | "en";
  merchantData: string;
}

/** Protocol version. 1.0 is deprecated per the Flitt docs. */
const VERSION = "1.0.1";
/** Seconds the customer has to finish checkout before the order expires. */
const LIFETIME = 3600;

async function postJson(url: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new FlittError(`Flitt HTTP ${res.status}`);
  }
  const json = (await res.json()) as { response?: Record<string, unknown> };
  if (!json.response) throw new FlittError("Flitt response missing root object");
  return json.response;
}

/**
 * Create a hosted checkout and return the URL to send the customer to.
 *
 * Server-to-server rather than a browser form POST, so the signature never
 * enters the DOM and API errors arrive as JSON we can classify.
 */
export async function createCheckoutUrl(
  input: CheckoutInput
): Promise<{ checkoutUrl: string; paymentId: number | null }> {
  const { merchantId, paymentKey, apiBase } = getFlittConfig();

  const params: FlittParams = {
    order_id: input.orderId,
    merchant_id: merchantId,
    order_desc: input.orderDesc,
    amount: input.amount,
    currency: "GEL",
    server_callback_url: input.serverCallbackUrl,
    response_url: input.responseUrl,
    lang: input.lang,
    lifetime: LIFETIME,
    merchant_data: input.merchantData,
    version: VERSION,
  };
  params.signature = sign(paymentKey, params);

  const response = await postJson(`${apiBase}/api/checkout/url`, { request: params });

  if (response.response_status !== "success") {
    // A request/config failure, not a card decline — surface the code for logs.
    throw new FlittError(
      String(response.error_message ?? "Flitt rejected the checkout request"),
      typeof response.error_code === "number" ? response.error_code : undefined
    );
  }
  const checkoutUrl = response.checkout_url;
  if (typeof checkoutUrl !== "string") {
    throw new FlittError("Flitt response missing checkout_url");
  }
  return {
    checkoutUrl,
    paymentId: typeof response.payment_id === "number" ? response.payment_id : null,
  };
}

/**
 * Poll the authoritative order state. Used only for payments still sitting in
 * `created` or `processing`, i.e. when a callback has not arrived.
 */
export async function getOrderStatus(orderId: string): Promise<FlittCallbackPayload> {
  const { merchantId, paymentKey, apiBase } = getFlittConfig();

  const params: FlittParams = {
    order_id: orderId,
    merchant_id: merchantId,
    version: VERSION,
  };
  params.signature = sign(paymentKey, params);

  const response = await postJson(`${apiBase}/api/status/order_id`, { request: params });
  return response as unknown as FlittCallbackPayload;
}
