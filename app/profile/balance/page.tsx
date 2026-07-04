"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Wallet } from "lucide-react";

export default function BalancePage() {
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
        <h1 className="text-2xl font-bold text-[#0F2830] mb-6">ბალანსის შევსება</h1>

        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
          {/* Current balance */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#EBF6FA] flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-[#0E4A5C]" />
            </div>
            <div>
              <p className="text-sm text-stone-500">მიმდინარე ბალანსი</p>
              <p className="text-3xl font-bold text-[#0F2830]">
                {balance === null ? "—" : `${balance.toLocaleString()} ₾`}
              </p>
            </div>
          </div>

          <div className="h-px bg-stone-100" />

          {/* Top-up placeholder — wired up later */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-stone-700">
              შევსების თანხა
            </label>
            <input
              type="number"
              min="0"
              disabled
              placeholder="მალე ხელმისაწვდომი იქნება"
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-stone-50 text-stone-400 focus:outline-none"
            />
            <button
              disabled
              className="w-full py-3 bg-[#0E4A5C] text-white font-semibold rounded-xl opacity-50 cursor-not-allowed"
            >
              შევსება
            </button>
            <p className="text-xs text-stone-400 text-center">
              გადახდის სისტემა მალე დაემატება.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
