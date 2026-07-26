import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import PaymentModel from "@/lib/models/Payment";
import ListingModel from "@/lib/models/Listing";
import { getFlittConfig } from "@/lib/flitt/config";
import { getOrderStatus } from "@/lib/flitt/client";
import { verifySignature } from "@/lib/flitt/signature";
import { reconcilePayment } from "@/lib/flitt/reconcile";

/** Statuses that are still in flight and worth re-polling Flitt for. */
const PENDING = new Set(["created", "processing"]);

type PaymentRecord = {
  userId: { toString(): string };
  listingId: { toString(): string };
  status: string;
  tier: string;
  amount: number;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    let payment = await PaymentModel.findOne({ orderId }).lean<PaymentRecord | null>();

    if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (payment.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Self-healing path: if the callback never landed, ask Flitt directly and
    // run the exact same reconcile the webhook would have run.
    if (PENDING.has(payment.status)) {
      try {
        const remote = await getOrderStatus(orderId);
        const { paymentKey } = getFlittConfig();
        if (verifySignature(paymentKey, remote)) {
          await reconcilePayment(remote);
          payment = await PaymentModel.findOne({ orderId }).lean<PaymentRecord | null>();
        } else {
          console.warn(`[flitt] status signature rejected for ${orderId}`);
        }
      } catch (err) {
        // Polling is best-effort; fall through and return the stored state.
        console.error(
          `[flitt] status poll failed for ${orderId}`,
          err instanceof Error ? err.message : err
        );
      }
    }

    if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const listing = await ListingModel.findById(payment.listingId).lean<{
      vipUntil?: Date | null;
    } | null>();

    return NextResponse.json({
      orderId,
      status: payment.status,
      tier: payment.tier,
      amount: payment.amount,
      listingId: payment.listingId.toString(),
      vipUntil: listing?.vipUntil ? listing.vipUntil.toISOString() : null,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
