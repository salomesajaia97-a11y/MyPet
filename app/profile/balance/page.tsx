"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Wallet, Sparkles, Receipt, List } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

/**
 * Balance overview.
 *
 * There is no wallet top-up: VIP promotion is paid by card per listing, not
 * out of a stored balance. This page used to show an inert "coming soon"
 * top-up form, which read as broken once card payments went live — it now
 * states how promotion is actually paid for and routes there.
 */
export default function BalancePage() {
  const { t } = useT();
  const router = useRouter();
  const { status } = useSession();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then(({ user }) => setBalance(user?.balance ?? 0))
      .catch(() => setBalance(0));
  }, [status]);

  return (
    <div className="min-h-screen bg-[#EBF6FA] py-8">
      <div className="max-w-xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-[#0F2830] mb-6">{t.profile.balance.title}</h1>

        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
          {/* Current balance */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#EBF6FA] flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-[#0E4A5C]" />
            </div>
            <div>
              <p className="text-sm text-stone-500">{t.profile.balance.current}</p>
              <p className="text-3xl font-bold text-[#0F2830]">
                {balance === null ? "—" : `${balance.toLocaleString()} ₾`}
              </p>
            </div>
          </div>

          <div className="h-px bg-stone-100" />

          {/* How promotion is actually paid for */}
          <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#0F2830]">
                  {t.profile.balance.promoTitle}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-stone-600">
                  {t.profile.balance.promoBody}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/vip"
                className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white hover:bg-amber-600"
              >
                {t.profile.balance.promoCta}
              </Link>
              <Link
                href="/profile/listings"
                className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-[#0F2830] hover:bg-stone-50"
              >
                <List className="h-3.5 w-3.5" />
                {t.profile.balance.myListings}
              </Link>
            </div>
          </div>

          <Link
            href="/profile/payments"
            className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#0E4A5C] underline"
          >
            <Receipt className="h-3.5 w-3.5" />
            {t.profile.balance.historyCta}
          </Link>
        </div>
      </div>
    </div>
  );
}
