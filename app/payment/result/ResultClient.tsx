"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

type Result = {
  status: string;
  tier: string;
  listingId: string;
  vipUntil: string | null;
};

/** Poll while the payment is still in flight, up to ~30s. */
const PENDING = new Set(["created", "processing"]);
const INTERVAL_MS = 2000;
const MAX_POLLS = 15;

export function ResultClient({ orderId }: { orderId: string }) {
  const { t } = useT();
  const [result, setResult] = useState<Result | null>(null);
  const [failed, setFailed] = useState(false);
  // Polling stops after MAX_POLLS. Without this the page kept spinning
  // forever, which reads like the payment is stuck and invites paying twice —
  // the callback still lands on its own, so say so and let the customer leave.
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    let polls = 0;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/flitt/status/${encodeURIComponent(orderId)}`);
        if (!res.ok) throw new Error("status failed");
        const data = (await res.json()) as Result;
        if (cancelled) return;
        setResult(data);
        if (!PENDING.has(data.status)) return;
        if (++polls < MAX_POLLS) timer = setTimeout(tick, INTERVAL_MS);
        else setGaveUp(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    };

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderId]);

  if (failed) {
    return <Shell icon="error" title={t.vip.result.errorTitle} body={t.vip.result.errorBody} />;
  }
  if (gaveUp && (!result || PENDING.has(result.status))) {
    return (
      <Shell
        icon="waiting"
        title={t.vip.result.slowTitle}
        body={t.vip.result.slowBody}
        href={result ? `/listings/${result.listingId}` : "/profile/listings"}
        cta={t.vip.result.viewListing}
      />
    );
  }
  if (!result || PENDING.has(result.status)) {
    return (
      <Shell icon="pending" title={t.vip.result.pendingTitle} body={t.vip.result.pendingBody} />
    );
  }
  if (result.status === "approved") {
    return (
      <Shell
        icon="success"
        title={t.vip.result.successTitle}
        body={
          result.vipUntil
            ? `${t.vip.result.activeUntil} ${new Date(result.vipUntil).toLocaleDateString()}`
            : t.vip.result.successBody
        }
        href={`/listings/${result.listingId}`}
        cta={t.vip.result.viewListing}
      />
    );
  }
  return (
    <Shell
      icon="error"
      title={t.vip.result.declinedTitle}
      body={t.vip.result.declinedBody}
      href={`/listings/${result.listingId}`}
      cta={t.vip.result.backToListing}
    />
  );
}

function Shell({
  icon,
  title,
  body,
  href,
  cta,
}: {
  icon: "pending" | "waiting" | "success" | "error";
  title: string;
  body: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="min-h-screen bg-[#EBF6FA] py-16">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <div className="flex justify-center mb-4">
            {icon === "pending" && <Loader2 className="w-10 h-10 text-[#0E4A5C] animate-spin" />}
            {/* Not a spinner: nothing is being waited on any more. */}
            {icon === "waiting" && <Clock className="w-10 h-10 text-amber-500" />}
            {icon === "success" && <CheckCircle2 className="w-10 h-10 text-green-600" />}
            {icon === "error" && <XCircle className="w-10 h-10 text-red-600" />}
          </div>
          <h1 className="text-xl font-bold text-[#0F2830] mb-2">{title}</h1>
          <p className="text-sm text-stone-500">{body}</p>
          {href && cta && (
            <Link
              href={href}
              className="mt-6 inline-block rounded-xl bg-[#0E4A5C] px-5 py-3 text-sm font-semibold text-white"
            >
              {cta}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
