import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/settings";

/**
 * Public price list.
 *
 * The pricing page and the promote dialog are client components, and prices are
 * now editable from the panel, so they need somewhere to read the live table
 * from. Both render the code defaults first and replace them with this, which
 * means a slow or failed request shows slightly stale prices rather than an
 * empty card — and the checkout route prices the order server-side regardless,
 * so what is displayed can never decide what is charged.
 *
 * `payments` rides along so the dialog can say "unavailable" instead of letting
 * someone press Pay into a 503.
 */
export async function GET() {
  const { vip, flags } = await getSiteSettings();
  return NextResponse.json({ packages: vip, paymentsEnabled: flags.payments });
}
