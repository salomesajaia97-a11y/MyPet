"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/components/i18n/LanguageProvider";
import { VIP_PACKAGES, VIP_TIERS, type VipTier } from "@/lib/marketplace/vipPackages";

export interface GrantedVip {
  isVip: boolean;
  vipTier: VipTier | null;
  vipRank: number;
  vipUntil: string | null;
}

/**
 * Comp or revoke a promotion from the panel.
 *
 * The tier is what matters — it decides placement — so it is picked explicitly
 * rather than implied by a toggle. The duration defaults to the tier's paid
 * length so a comp matches what a customer would have got, and "no expiry"
 * exists for a partner arrangement that should not lapse.
 */
export function VipGrantDialog({
  listingId,
  listingLabel,
  current,
  open,
  onClose,
  onDone,
}: {
  listingId: string;
  listingLabel: string;
  current: { isVip: boolean; vipTier: VipTier | null; vipUntil: string | null };
  open: boolean;
  onClose: () => void;
  onDone: (vip: GrantedVip) => void;
}) {
  const { t } = useT();
  const [tier, setTier] = useState<VipTier>(current.vipTier ?? "super");
  const [days, setDays] = useState<string>(String(VIP_PACKAGES[current.vipTier ?? "super"].days));
  const [noExpiry, setNoExpiry] = useState(current.isVip && current.vipUntil === null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}/vip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed");
      onDone(data.vip as GrantedVip);
      onClose();
    } catch {
      setError(t.admin.vip.error);
    } finally {
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
      <DialogContent closeLabel={t.common.dialog.cancel} className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t.admin.vip.title}</DialogTitle>
          <DialogDescription>{listingLabel}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              {t.admin.vip.tier}
            </label>
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
              {VIP_TIERS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setTier(value);
                    setDays(String(VIP_PACKAGES[value].days));
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    tier === value ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {t.vip.tiers[value].name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              {t.admin.vip.days}
            </label>
            <input
              type="number"
              min={1}
              max={3650}
              value={days}
              disabled={noExpiry}
              onChange={(e) => setDays(e.target.value)}
              className="w-28 rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:bg-gray-50 disabled:text-gray-400"
            />
            <label className="ml-3 inline-flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={noExpiry}
                onChange={(e) => setNoExpiry(e.target.checked)}
              />
              {t.admin.vip.noExpiry}
            </label>
          </div>

          <p className="text-xs text-gray-400">{t.admin.vip.extendsNote}</p>
          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              send({ tier, days: noExpiry ? null : Number(days) })
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {t.admin.vip.grant}
          </button>
          {current.isVip && (
            <button
              type="button"
              disabled={busy}
              onClick={() => send({ action: "revoke" })}
              className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60"
            >
              {t.admin.vip.revoke}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
