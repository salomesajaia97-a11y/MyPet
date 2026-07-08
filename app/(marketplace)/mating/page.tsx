import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { MarketplaceTabs } from "@/components/marketplace/MarketplaceTabs";
import { MarketplaceSearch } from "@/components/marketplace/MarketplaceSearch";
import { getListings, countListings, getPage } from "@/lib/marketplace/queries";
import { Pager } from "@/components/marketplace/Pager";
import { formatAge } from "@/lib/marketplace/format";
import { getServerDictionary } from "@/lib/i18n/server";
import type { Dictionary } from "@/lib/i18n";
import type { MatingListing } from "@/types/marketplace";

export default async function MatingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { t } = await getServerDictionary();
  const [listings, total] = await Promise.all([
    getListings("mating", sp) as Promise<MatingListing[]>,
    countListings("mating", sp),
  ]);

  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <h1 className="sr-only">{t.marketplace.titleMating}</h1>
        <Suspense fallback={null}>
          <MarketplaceTabs active="mating" />
          <MarketplaceSearch filters type="mating" />
        </Suspense>

        {listings.length === 0 ? (
          <div className="py-20 text-center text-stone-400">
            <div className="text-5xl mb-4">🐾</div>
            <p className="font-medium">{t.marketplace.noListings}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map((listing) => (
                <ListingCard key={listing._id} listing={listing} t={t} />
              ))}
            </div>
            <Pager basePath="/mating" params={sp} page={getPage(sp)} total={total} />
          </>
        )}
      </div>
      <FAB />
    </div>
  );
}

function ListingCard({ listing, t }: { listing: MatingListing; t: Dictionary }) {
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
          <div className="absolute top-3 left-3 bg-purple-700 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
            {t.common.categories.mating}
          </div>
          {listing.price !== null && (
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-sm font-bold text-[#0F2830]">
              {listing.price.toLocaleString()}₾
            </div>
          )}
        </div>
        <div className="p-4 space-y-2.5">
          <div>
            <p className="font-bold text-[#0F2830] text-base">{listing.breed}</p>
            <p className="text-stone-500 text-sm">
              {listing.sex === "male" ? t.marketplace.sexMale : t.marketplace.sexFemale} • {formatAge(listing.age, t.marketplace.units)} • {listing.weight}{t.marketplace.units.kg}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {listing.price === null && (
              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                {t.marketplace.free}
              </span>
            )}
          </div>
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
