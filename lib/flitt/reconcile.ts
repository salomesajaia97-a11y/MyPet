import PaymentModel from "@/lib/models/Payment";
import { applyVipForOrder } from "@/lib/marketplace/applyVip";
import type { FlittCallbackPayload, FlittOrderStatus } from "./types";

const KNOWN_STATUSES: FlittOrderStatus[] = [
  "created",
  "processing",
  "declined",
  "approved",
  "expired",
  "reversed",
];

/**
 * Apply a verified Flitt payload to our Payment record, then grant VIP if it
 * is approved. Shared by the callback webhook and the status-polling route so
 * both paths behave identically — the poll is what makes a lost callback
 * recoverable.
 *
 * The caller must have verified the signature first.
 */
export async function reconcilePayment(
  payload: FlittCallbackPayload
): Promise<"ok" | "unknown-order" | "mismatch"> {
  const orderId = payload.order_id;
  const payment = await PaymentModel.findOne({ orderId }).lean<{
    amount: number;
    currency: string;
  } | null>();
  if (!payment) return "unknown-order";

  // A signed payload whose amount does not match what we recorded means the
  // order was created against a different merchant config or was manipulated
  // upstream. Record it, refuse to grant, leave it for an admin.
  const claimedAmount = Number(payload.amount ?? payload.actual_amount ?? NaN);
  const currency = String(payload.currency ?? payment.currency);
  if (Number.isFinite(claimedAmount) && claimedAmount !== payment.amount) {
    await PaymentModel.updateOne({ orderId }, { $set: { note: "amountMismatch", raw: payload } });
    console.warn(`[flitt] amount mismatch on ${orderId}: expected ${payment.amount}`);
    return "mismatch";
  }
  if (currency !== payment.currency) {
    await PaymentModel.updateOne({ orderId }, { $set: { note: "currencyMismatch", raw: payload } });
    console.warn(`[flitt] currency mismatch on ${orderId}`);
    return "mismatch";
  }

  const status = payload.order_status;
  const update: Record<string, unknown> = { raw: payload };
  if (status && KNOWN_STATUSES.includes(status)) update.status = status;
  if (typeof payload.payment_id === "number") update.paymentId = payload.payment_id;
  if (payload.response_code !== undefined && payload.response_code !== null) {
    update.responseCode = Number(payload.response_code);
  }
  if (payload.response_description) {
    update.responseDescription = String(payload.response_description);
  }

  await PaymentModel.updateOne({ orderId }, { $set: update });

  if (status === "approved") {
    await applyVipForOrder(orderId);
  }
  return "ok";
}
