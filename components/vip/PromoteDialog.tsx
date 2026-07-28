"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/components/i18n/LanguageProvider";
import { VIP_TIERS, formatGel, type VipTier } from "@/lib/marketplace/vipPackages";
import { useVipPackages } from "@/components/vip/useVipPackages";

/**
 * Tier picker that hands off to Flitt hosted checkout. The client sends only
 * the listing id and the tier — the server looks up the price, so nothing here
 * can influence what is charged.
 *
 * Built on the shared Radix dialog rather than a hand-rolled overlay: this is
 * the last screen before a payment, and the hand-rolled version could not be
 * dismissed with Escape, let focus wander to the page behind it, and left that
 * page scrolling under the sheet.
 */
export function PromoteDialog({
  listingId,
  open,
  onClose,
}: {
  listingId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useT();
  const { packages, paymentsEnabled } = useVipPackages();
  const [selected, setSelected] = useState<VipTier>("super");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/flitt/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, tier: selected }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) throw new Error(data.error ?? "checkout failed");
      // Full document navigation — we are leaving the app for Flitt's page.
      window.location.href = data.checkoutUrl;
    } catch {
      setError(t.vip.dialog.error);
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      {/* Sits on the bottom edge on phones and centres from sm up, which is how
          the picker read before it moved onto the shared dialog. */}
      <DialogContent
        closeLabel={t.vip.dialog.cancel}
        className="max-w-md gap-0 bg-white top-auto bottom-2 translate-y-0 rounded-2xl sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2"
      >
        <DialogHeader className="mb-4 pr-6">
          <DialogTitle className="text-lg font-bold text-[#0F2830]">
            {t.vip.dialog.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500">
            {t.vip.dialog.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {VIP_TIERS.map((tier) => {
            const pkg = packages[tier];
            const active = selected === tier;
            return (
              <button
                key={tier}
                type="button"
                onClick={() => setSelected(tier)}
                aria-pressed={active}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                  active ? "border-[#0E4A5C] bg-[#EBF6FA]" : "border-stone-200 hover:bg-stone-50"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    active ? "border-[#0E4A5C] bg-[#0E4A5C] text-white" : "border-stone-300"
                  }`}
                >
                  {active && <Check className="h-3 w-3" />}
                </span>
                {/* The tier name already states the duration, so no separate
                    days line here — it only read as a repeat of itself. */}
                <span className="min-w-0 flex-1 text-sm font-bold text-[#0F2830]">
                  {t.vip.tiers[tier].name}
                </span>
                <span className="shrink-0 text-base font-bold text-[#0F2830]">
                  {formatGel(pkg.amount)} {t.vip.gel}
                </span>
              </button>
            );
          })}
        </div>

        {error && <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>}

        {/* Say it up front rather than letting Pay lead into a 503. */}
        {!paymentsEnabled && (
          <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            {t.vip.dialog.paymentsOff}
          </p>
        )}

        <button
          type="button"
          onClick={pay}
          disabled={busy || !paymentsEnabled}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0E4A5C] py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy
            ? t.vip.dialog.redirecting
            : `${t.vip.dialog.pay} ${formatGel(packages[selected].amount)} ${t.vip.gel}`}
        </button>
      </DialogContent>
    </Dialog>
  );
}
