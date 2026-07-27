"use client";

import { useEffect, useRef, useState } from "react";
import { Eye } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

/**
 * Views chip in the listing meta row. Renders the server's count immediately,
 * then registers this visit and swaps in the number the server returns — so the
 * reader sees their own view reflected without a reload.
 *
 * Registration runs from the client on purpose: it keeps non-JS crawlers out of
 * the count, and it keeps the page render itself side-effect free.
 */
export function ViewCounter({
  listingId,
  initialViews,
}: {
  listingId: string;
  initialViews: number;
}) {
  const { t } = useT();
  const [views, setViews] = useState(initialViews);
  // Guards against React's development double-mount firing two requests. The
  // server would dedupe them anyway; this just avoids the wasted round trip.
  const registered = useRef(false);

  useEffect(() => {
    if (registered.current) return;
    registered.current = true;

    const controller = new AbortController();
    fetch(`/api/marketplace/listing/${listingId}/view`, {
      method: "POST",
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (typeof data?.views === "number") setViews(data.views);
      })
      // The counter is decoration — a failed or rate-limited call just leaves
      // the server-rendered number on screen.
      .catch(() => {});

    return () => controller.abort();
  }, [listingId]);

  return (
    <span className="flex items-center gap-1.5">
      <Eye className="w-4 h-4" />
      <span className="tabular-nums">{views.toLocaleString()}</span>
      {t.listings.detail.views}
    </span>
  );
}
