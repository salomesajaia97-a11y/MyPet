"use client";

import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";
import {
  VIP_PACKAGES,
  VIP_TIERS,
  formatGel,
  type VipTier,
} from "@/lib/marketplace/vipPackages";

/**
 * Tier picker that hands off to Flitt hosted checkout. The client sends only
 * the listing id and the tier — the server looks up the price, so nothing here
 * can influence what is charged.
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
  const [selected, setSelected] = useState<VipTier>("super");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

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
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.vip.dialog.title}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0F2830]">{t.vip.dialog.title}</h2>
            <p className="text-xs text-stone-500">{t.vip.dialog.subtitle}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t.vip.dialog.cancel}>
            <X className="h-5 w-5 text-stone-400" />
          </button>
        </div>

        <div className="space-y-2">
          {VIP_TIERS.map((tier) => {
            const pkg = VIP_PACKAGES[tier];
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
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[#0F2830]">
                    {t.vip.tiers[tier].name}
                  </span>
                  <span className="block text-xs text-stone-500">
                    {pkg.days} {t.vip.perDays}
                  </span>
                </span>
                <span className="shrink-0 text-base font-bold text-[#0F2830]">
                  {formatGel(pkg.amount)} {t.vip.gel}
                </span>
              </button>
            );
          })}
        </div>

        {error && <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>}

        <button
          type="button"
          onClick={pay}
          disabled={busy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0E4A5C] py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy
            ? t.vip.dialog.redirecting
            : `${t.vip.dialog.pay} ${formatGel(VIP_PACKAGES[selected].amount)} ${t.vip.gel}`}
        </button>
      </div>
    </div>
  );
}
