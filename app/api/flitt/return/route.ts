import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getFlittConfig, isFlittConfigured } from "@/lib/flitt/config";
import { verifySignature } from "@/lib/flitt/signature";
import { reconcilePayment } from "@/lib/flitt/reconcile";
import type { FlittCallbackPayload } from "@/lib/flitt/types";

/**
 * Customer return target handed to Flitt as `response_url`.
 *
 * This is an API route rather than the result page itself because Flitt may
 * return the customer with a POST, and an App Router page only answers GET —
 * a POST straight to `/payment/result` would 405. Absorbing it here and
 * answering 303 turns the next hop into a same-site GET navigation, which also
 * means the session cookie is sent (a cross-site POST with SameSite=Lax would
 * not carry it, and the result page needs a session to poll status).
 *
 * The payload is display-grade only. `server_callback_url` remains the
 * authoritative result; reconciling here just makes the result page instant
 * when the customer beats the webhook back.
 */
async function readPayload(req: NextRequest): Promise<FlittCallbackPayload | null> {
  const contentType = req.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      return (await req.json()) as FlittCallbackPayload;
    }
    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const form = await req.formData();
      const flat: Record<string, string> = {};
      for (const [key, value] of form.entries()) {
        if (typeof value === "string") flat[key] = value;
      }
      return flat as unknown as FlittCallbackPayload;
    }
  } catch {
    return null;
  }
  return null;
}

function resultRedirect(req: NextRequest, orderId: string | null) {
  const url = new URL(orderId ? `/payment/result?order_id=${encodeURIComponent(orderId)}` : "/", req.url);
  // 303 so the browser follows with GET regardless of how it arrived here.
  return NextResponse.redirect(url, 303);
}

export async function POST(req: NextRequest) {
  const payload = await readPayload(req);
  const orderId = payload?.order_id ? String(payload.order_id) : req.nextUrl.searchParams.get("order_id");

  if (payload && isFlittConfigured()) {
    const { paymentKey } = getFlittConfig();
    if (verifySignature(paymentKey, payload)) {
      try {
        await connectDB();
        await reconcilePayment(payload);
      } catch (err) {
        // Best-effort only — the webhook and the status poll both still cover this.
        console.error("[flitt] return reconcile failed", err instanceof Error ? err.message : err);
      }
    }
  }

  return resultRedirect(req, orderId);
}

export async function GET(req: NextRequest) {
  return resultRedirect(req, req.nextUrl.searchParams.get("order_id"));
}
