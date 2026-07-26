import { redirect } from "next/navigation";
import { ResultClient } from "./ResultClient";

/**
 * Post-checkout result screen. Reached via `/api/flitt/return`, which absorbs
 * Flitt's return (possibly a POST) and 303s here with the order id.
 *
 * Display only — the authoritative result comes from the server callback, and
 * this page's polling endpoint reconciles anything the callback missed.
 */
export default async function PaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id: orderId } = await searchParams;
  if (!orderId) redirect("/");
  return <ResultClient orderId={orderId} />;
}
