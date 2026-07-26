import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import PaymentModel from "@/lib/models/Payment";
import ListingModel from "@/lib/models/Listing";

/** The signed-in user's own purchases, newest first. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    // Referencing the Listing model here guarantees it is registered before
    // populate() runs — Mongoose throws MissingSchemaError otherwise.
    void ListingModel;

    const docs = await PaymentModel.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("listingId", "breed")
      .lean<
        {
          _id: { toString(): string };
          orderId: string;
          tier: string;
          amount: number;
          currency: string;
          status: string;
          createdAt: Date;
          listingId?: { _id: { toString(): string }; breed?: string } | null;
        }[]
      >();

    return NextResponse.json({
      payments: docs.map((p) => ({
        _id: p._id.toString(),
        orderId: p.orderId,
        tier: p.tier,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
        listingId: p.listingId?._id?.toString() ?? null,
        listingBreed: p.listingId?.breed ?? null,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
