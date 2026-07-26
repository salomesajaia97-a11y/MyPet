import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import ListingModel from "@/lib/models/Listing";
import PaymentModel from "@/lib/models/Payment";
import { handleMutationError } from "@/lib/api/errors";
import { rateLimit } from "@/lib/rateLimit";
import { getServerLocale } from "@/lib/i18n/server";
import { flittBaseUrl, isFlittConfigured } from "@/lib/flitt/config";
import { createCheckoutUrl, FlittError } from "@/lib/flitt/client";
import { VIP_PACKAGES, isVipTier } from "@/lib/marketplace/vipPackages";

/** Merchant-generated, unique, and safe to echo in URLs. */
function newOrderId(listingId: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `mypet_${listingId}_${Date.now().toString(36)}${rand}`;
}

export async function POST(req: NextRequest) {
  // Fail before creating a Payment row we could never complete.
  if (!isFlittConfigured()) {
    console.error("[flitt] checkout attempted but Flitt credentials are not configured");
    return NextResponse.json({ error: "Payments are temporarily unavailable" }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Each attempt costs a Flitt order. Cap runaway retry loops.
  const limited = rateLimit(`flitt-checkout:${session.user.id}`, 10, 3_600_000);
  if (limited) return limited;

  let body: { listingId?: unknown; tier?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const listingId = typeof body.listingId === "string" ? body.listingId : "";
  if (!isValidObjectId(listingId) || !isVipTier(body.tier)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  // Price and duration come from the server table, never from the client.
  const pkg = VIP_PACKAGES[body.tier];

  try {
    await connectDB();

    const listing = await ListingModel.findById(listingId).lean<{
      _id: unknown;
      userId?: { toString(): string };
    } | null>();
    if (!listing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (listing.userId?.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const orderId = newOrderId(listingId);
    await PaymentModel.create({
      orderId,
      listingId,
      userId: session.user.id,
      tier: pkg.tier,
      days: pkg.days,
      amount: pkg.amount,
      currency: "GEL",
      status: "created",
    });

    const base = flittBaseUrl();
    const locale = await getServerLocale();

    try {
      const { checkoutUrl, paymentId } = await createCheckoutUrl({
        orderId,
        amount: pkg.amount,
        orderDesc: `MyPet VIP ${pkg.tier} - ${pkg.days} days - listing ${listingId}`,
        serverCallbackUrl: `${base}/api/flitt/callback`,
        // Routed through an API handler, not straight to the page: Flitt may
        // return the customer with a POST, which a page route cannot answer.
        responseUrl: `${base}/api/flitt/return?order_id=${encodeURIComponent(orderId)}`,
        lang: locale === "en" ? "en" : "ka",
        merchantData: JSON.stringify({ listingId, tier: pkg.tier }),
      });
      if (paymentId !== null) {
        await PaymentModel.updateOne({ orderId }, { $set: { paymentId } });
      }
      return NextResponse.json({ checkoutUrl, orderId });
    } catch (err) {
      // Never log the payment key or the signature — just the classification.
      const code = err instanceof FlittError ? err.code : undefined;
      console.error(
        `[flitt] checkout failed for ${orderId}`,
        code ?? "",
        err instanceof Error ? err.message : err
      );
      await PaymentModel.updateOne(
        { orderId },
        { $set: { status: "declined", responseDescription: "checkout_create_failed" } }
      );
      return NextResponse.json({ error: "Payment provider unavailable" }, { status: 502 });
    }
  } catch (err) {
    return handleMutationError(err, "flitt/checkout POST");
  }
}
