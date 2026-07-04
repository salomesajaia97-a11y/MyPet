import { Suspense } from "react";
import Link from "next/link";
import { MarketplaceTabs } from "@/components/marketplace/MarketplaceTabs";
import { MarketplaceSearch } from "@/components/marketplace/MarketplaceSearch";
import { buildListingQuery } from "@/lib/marketplace/filters";
import type { LostFoundListing } from "@/types/marketplace";

async function getListings(query: string): Promise<LostFoundListing[]> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(
      `${base}/api/marketplace/lost-found${query ? `?${query}` : ""}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const { listings } = await res.json();
    return listings ?? [];
  } catch {
    return [];
  }
}

export default async function LostFoundPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const listings = await getListings(buildListingQuery(await searchParams));

  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <Suspense fallback={null}>
          <MarketplaceTabs active="lost-found" />
          <MarketplaceSearch filters type="lost-found" />
        </Suspense>

        {listings.length === 0 ? (
          <div className="py-20 text-center text-stone-400">
            <div className="text-5xl mb-4">🐾</div>
            <p className="font-medium">განცხადება არ მოიძებნა</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
        )}
      </div>
      <FAB />
    </div>
  );
}

function ListingCard({ listing }: { listing: LostFoundListing }) {
  const isLost = listing.status === "lost";
  return (
    <Link href={`/listings/${listing._id}`} className="block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
        <div className="relative aspect-[4/3] bg-stone-100">
          {listing.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={listing.images[0]} alt={listing.breed} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🐾</div>
          )}
          <div
            className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold text-white ${
              isLost ? "bg-red-500" : "bg-green-600"
            }`}
          >
            {isLost ? "დაიკარგა" : "ნაპოვნია"}
          </div>
          {listing.reward !== null && listing.reward > 0 && (
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-sm font-bold text-[#0F2830]">
              {listing.reward.toLocaleString()}₾
            </div>
          )}
        </div>
        <div className="p-4 space-y-2.5">
          <div>
            <p className="font-bold text-[#0F2830] text-base">{listing.breed}</p>
            <p className="text-stone-500 text-sm">{listing.species} • {listing.neighborhood}</p>
          </div>
          <p className="text-xs text-stone-400">
            {isLost ? "დაიკარგა:" : "ნაპოვნია:"} {new Date(listing.lastSeenDate).toLocaleDateString("ka-GE")}
          </p>
          <p className="text-sm text-stone-500 flex items-center gap-1">
            <span>📍</span> {listing.location}
          </p>
        </div>
      </div>
    </Link>
  );
}

function FAB() {
  return (
    <Link
      href="/listings/new"
      className="fixed bottom-6 right-6 w-14 h-14 bg-[#0E4A5C] text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-[#0B3D4E] transition-colors z-50"
    >
      +
    </Link>
  );
}
