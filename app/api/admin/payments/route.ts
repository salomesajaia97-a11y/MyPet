import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import PaymentModel from "@/lib/models/Payment";
import UserModel from "@/lib/models/User";
import ListingModel from "@/lib/models/Listing";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "admin") return null;
  return session;
}

const VALID_STATUSES = [
  "created",
  "processing",
  "approved",
  "declined",
  "expired",
  "reversed",
];

/** Read-only reconciliation view. No mutations — refunds happen in the Flitt portal. */
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = new URL(req.url).searchParams.get("status") ?? "";
  const filter: Record<string, unknown> = {};
  if (VALID_STATUSES.includes(status)) filter.status = status;

  try {
    await connectDB();
    // Ensure both referenced models are registered before populate() runs.
    void UserModel;
    void ListingModel;

    const docs = await PaymentModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("userId", "email name")
      .populate("listingId", "breed")
      .lean<
        {
          _id: { toString(): string };
          orderId: string;
          paymentId?: number | null;
          tier: string;
          amount: number;
          currency: string;
          status: string;
          note?: string | null;
          createdAt: Date;
          userId?: { email?: string; name?: string } | null;
          listingId?: { _id: { toString(): string }; breed?: string } | null;
        }[]
      >();

    return NextResponse.json({
      payments: docs.map((p) => ({
        _id: p._id.toString(),
        orderId: p.orderId,
        paymentId: p.paymentId ?? null,
        tier: p.tier,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        note: p.note ?? null,
        createdAt: p.createdAt.toISOString(),
        user: p.userId?.email ?? p.userId?.name ?? "—",
        listingId: p.listingId?._id?.toString() ?? null,
        listingBreed: p.listingId?.breed ?? null,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
