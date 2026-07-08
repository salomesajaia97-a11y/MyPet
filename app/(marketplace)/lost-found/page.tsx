import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { MarketplaceTabs } from "@/components/marketplace/MarketplaceTabs";
import { MarketplaceSearch } from "@/components/marketplace/MarketplaceSearch";
import { getListings, countListings, getPage } from "@/lib/marketplace/queries";
import { Pager } from "@/components/marketplace/Pager";
import { getServerDictionary } from "@/lib/i18n/server";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { LostFoundListing } from "@/types/marketplace";

export default async function LostFoundPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { t, locale } = await getServerDictionary();
  const [listings, total] = await Promise.all([
    getListings("lost-found", sp) as Promise<LostFoundListing[]>,
    countListings("lost-found", sp),
  ]);

  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <h1 className="sr-only">{t.marketplace.titleLostFound}</h1>
        <Suspense fallback={null}>
          <MarketplaceTabs active="lost-found" />
          <MarketplaceSearch filters type="lost-found" />
        </Suspense>

        {/* AI photo matcher entry point */}
        <Link
          href="/lost-found/match"
          className="group flex items-center gap-3 bg-white rounded-2xl border border-[#0E4A5C]/20 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all px-5 py-4"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0E4A5C]/10 text-[#0E4A5C] text-xl">
            ✨
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#0F2830] text-sm sm:text-base">{t.marketplace.aiPhotoSearch}</p>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              {t.marketplace.aiPhotoSearchDesc}
            </p>
          </div>
          <span className="text-[#0E4A5C] text-sm font-semibold shrink-0 group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>

        {listings.length === 0 ? (
          <div className="py-20 text-center text-stone-400">
            <div className="text-5xl mb-4">🐾</div>
            <p className="font-medium">{t.marketplace.noListings}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map((listing) => (
                <ListingCard key={listing._id} listing={listing} t={t} locale={locale} />
              ))}
            </div>
            <Pager basePath="/lost-found" params={sp} page={getPage(sp)} total={total} />
          </>
        )}
      </div>
      <FAB />
    </div>
  );
}

function ListingCard({ listing, t, locale }: { listing: LostFoundListing; t: Dictionary; locale: Locale }) {
  const isLost = listing.status === "lost";
  const species = t.marketplace.species[listing.species as keyof typeof t.marketplace.species] ?? listing.species;
  return (
    <Link href={`/listings/${listing._id}`} className="block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
        <div className="relative aspect-[4/3] bg-stone-100">
          {listing.images[0] ? (
            <Image
              src={listing.images[0]}
              alt={listing.breed}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🐾</div>
          )}
          <div
            className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold text-white ${
              isLost ? "bg-red-500" : "bg-green-600"
            }`}
          >
            {isLost ? t.marketplace.statusLost : t.marketplace.statusFound}
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
            <p className="text-stone-500 text-sm">{species} • {listing.neighborhood}</p>
          </div>
          <p className="text-xs text-stone-400">
            {isLost ? t.marketplace.statusLost : t.marketplace.statusFound}: {new Date(listing.lastSeenDate).toLocaleDateString(locale === "en" ? "en-US" : "ka-GE")}
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
