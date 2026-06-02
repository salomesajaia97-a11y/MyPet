import { Suspense } from "react";
import { MarketplaceTabs } from "@/components/marketplace/MarketplaceTabs";
import { MarketplaceSearch } from "@/components/marketplace/MarketplaceSearch";

export default function LostFoundPage() {
  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <Suspense fallback={null}>
          <MarketplaceTabs active="lost-found" />
          <MarketplaceSearch />
        </Suspense>
        <div className="py-20 text-center text-stone-400">
          <div className="text-5xl mb-4">🐾</div>
          <p className="font-medium">განცხადება არ მოიძებნა</p>
        </div>
      </div>
    </div>
  );
}
