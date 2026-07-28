"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";
import { VIP_TIERS, formatGel } from "@/lib/marketplace/vipPackages";
import { useVipPackages } from "@/components/vip/useVipPackages";

/**
 * Public pricing page for the paid promotion packages. Also the page a payment
 * provider looks for during merchant review: what is sold, at what price, and
 * on what refund terms, all stated plainly.
 */
export default function VipPricingPage() {
  const { t } = useT();
  // Prices are editable from the admin panel, so the page shows what is
  // currently in force rather than what was compiled in.
  const { packages } = useVipPackages();

  return (
    <div className="min-h-screen bg-[#EBF6FA] py-12">
      <div className="mx-auto max-w-5xl px-4">
        <h1 className="text-3xl font-bold text-[#0F2830]">{t.vip.pageTitle}</h1>
        <p className="mt-2 text-sm text-stone-500">{t.vip.pageSubtitle}</p>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {VIP_TIERS.map((tier) => {
            const pkg = packages[tier];
            const featured = tier === "super";
            return (
              <div
                key={tier}
                className={`flex flex-col rounded-2xl bg-white p-6 shadow-sm ${
                  featured ? "ring-2 ring-[#0E4A5C]" : ""
                }`}
              >
                <h2 className="text-lg font-bold text-[#0F2830]">{t.vip.tiers[tier].name}</h2>
                <p className="mt-1 text-3xl font-bold text-[#0E4A5C]">
                  {formatGel(pkg.amount)}
                  <span className="ml-1 text-base font-semibold text-stone-400">{t.vip.gel}</span>
                </p>
                <p className="mt-4 flex-1 text-sm text-stone-600">{t.vip.tiers[tier].desc}</p>
                {/* Buying always happens against a specific listing, so the CTA
                    routes to the owner's listings rather than a generic cart. */}
                <Link
                  href="/profile/listings"
                  className={`mt-6 rounded-xl py-3 text-center text-sm font-bold ${
                    featured ? "bg-[#0E4A5C] text-white" : "border border-[#0E4A5C] text-[#0E4A5C]"
                  }`}
                >
                  {t.vip.choose}
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-10 space-y-3 rounded-2xl bg-white p-6 text-sm text-stone-600 shadow-sm">
          <p className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            {t.vip.terms}
          </p>
          <p className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            {t.vip.refund}
          </p>
          <Link
            href="/terms"
            className="inline-block text-xs font-semibold text-[#0E4A5C] underline"
          >
            {t.vip.termsLink}
          </Link>
        </div>
      </div>
    </div>
  );
}
