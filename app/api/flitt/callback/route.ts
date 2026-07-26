import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getFlittConfig, isFlittConfigured } from "@/lib/flitt/config";
import { verifySignature } from "@/lib/flitt/signature";
import { reconcilePayment } from "@/lib/flitt/reconcile";
import type { FlittCallbackPayload } from "@/lib/flitt/types";

/**
 * Flitt server callback — the authoritative payment result.
 *
 * Contract from the docs that shapes this handler: the body is a flat JSON
 * object (not nested under `response`), redirects are never followed, the
 * timeout is 30s, and only HTTP 200 stops the retry schedule
 * (2s, 60s, 300s, 600s, 1h, 24h). So: verify, write, return 200 — nothing slow.
 * Flitt source IPs are 54.154.216.60 and 3.75.125.89.
 */
export async function POST(req: NextRequest) {
  let payload: FlittCallbackPayload;
  try {
    payload = (await req.json()) as FlittCallbackPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Checked before reading config, which throws in production when credentials
  // are unset. A 503 keeps the callback on Flitt's retry schedule so it is
  // redelivered once the environment is configured, rather than being lost.
  if (!isFlittConfigured()) {
    console.error("[flitt] callback received but Flitt credentials are not configured");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const { paymentKey } = getFlittConfig();
  if (!verifySignature(paymentKey, payload)) {
    // Never log the signature itself.
    console.warn(`[flitt] callback signature rejected for ${payload?.order_id ?? "unknown"}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await connectDB();
    const result = await reconcilePayment(payload);
    if (result === "unknown-order") {
      // 200 so Flitt stops retrying a callback we can never satisfy.
      console.warn(`[flitt] callback for unknown order ${payload.order_id}`);
    }
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    // A 500 makes Flitt retry, which is what we want for a transient DB fault.
    console.error("[flitt] callback processing failed", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
