import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MarketplaceTabs } from "@/components/marketplace/MarketplaceTabs";

import { MarketplaceSearch } from "@/components/marketplace/MarketplaceSearch";
import { getListings, countListings, getPage } from "@/lib/marketplace/queries";
import { Pager } from "@/components/marketplace/Pager";
import { formatAge, formatPrice } from "@/lib/marketplace/format";
import { getServerDictionary } from "@/lib/i18n/server";
import type { Dictionary } from "@/lib/i18n";
import type { BuySellListing } from "@/types/marketplace";
import { VipBadge } from "@/components/vip/VipBadge";
import { activeRank, tierForRank } from "@/lib/marketplace/vip";
import { JsonLd } from "@/components/seo/JsonLd";
import { browsePageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, collectionPageJsonLd, graph } from "@/lib/seo/jsonLd";
import {
  BRAND_KEYWORDS,
  BREED_KEYWORDS,
  BUY_SELL_KEYWORDS,
  buildKeywords,
  CITY_KEYWORDS,
} from "@/lib/seo/keywords";

const KEYWORDS = buildKeywords(
  BUY_SELL_KEYWORDS,
  BREED_KEYWORDS,
  CITY_KEYWORDS,
  BRAND_KEYWORDS,
);

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const { locale, t } = await getServerDictionary();
  return browsePageMetadata({
    locale,
    title: t.seo.buySell.title,
    description: t.seo.buySell.description,
    path: "/buy-sell",
    keywords: KEYWORDS,
    searchParams: sp,
    pageWord: t.seo.pageWord,
  });
}

export default async function BuySellPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { locale, t } = await getServerDictionary();
  const [listings, total] = await Promise.all([
    getListings("buy-sell", sp) as Promise<BuySellListing[]>,
    countListings("buy-sell", sp),
  ]);

  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      {/* Describe the page as a real index of the listings it renders, so the
          section can rank on its own rather than only via detail pages. */}
      <JsonLd
        data={graph(
          collectionPageJsonLd({
            locale,
            name: t.seo.buySell.title,
            description: t.seo.buySell.description,
            path: "/buy-sell",
            totalItems: total,
            keywords: KEYWORDS.slice(0, 25),
            items: listings.map((l) => ({
              name: l.breed,
              path: `/listings/${l._id}`,
              image: l.images?.[0],
            })),
          }),
          breadcrumbJsonLd([
            { name: t.seo.breadcrumbs.home, path: "/" },
            { name: t.seo.buySell.title, path: "/buy-sell" },
          ]),
        )}
      />
      <div className="max-w-5xl mx-auto px-4 py-6 pb-24 lg:pb-6 space-y-5">
        <h1 className="sr-only">{t.marketplace.titleBuySell}</h1>
        <Suspense fallback={null}>
          <MarketplaceTabs active="buy-sell" />
          <MarketplaceSearch filters type="buy-sell" />
        </Suspense>

        {listings.length === 0 ? (
          <div className="py-20 text-center text-stone-400 text-sm">
            {t.marketplace.emptyBuySell}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map((listing) => (
                <ListingCard key={listing._id} listing={listing} t={t} />
              ))}
            </div>
            <Pager basePath="/buy-sell" params={sp} page={getPage(sp)} total={total} />
          </>
        )}
      </div>
      <FAB />
    </div>
  );
}

function ListingCard({ listing, t }: { listing: BuySellListing; t: Dictionary }) {
  // Only a live promotion earns a badge — activeRank() returns 0 once
  // `vipUntil` has passed, so a lapsed listing renders as an ordinary one.
  const tier = tierForRank(activeRank(listing));
  return (
    <Link href={`/listings/${listing._id}`} className="block">
    <div className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
        tier === "ultra" ? "ring-2 ring-orange-400" : tier ? "ring-2 ring-amber-300/70" : ""
      }`}>
      <div className="relative aspect-[4/3] bg-stone-100">
        {tier && (
          <div className="absolute top-3 left-3 z-10">
            <VipBadge tier={tier} label={t.vip.badge[tier]} />
          </div>
        )}
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
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-sm font-bold text-[#0F2830]">
          {/* Priceless rows should not exist — the create route rejects them —
              but one predating that check must not throw and take the feed
              down with it. */}
          {formatPrice(listing.price, listing.currency) ?? "—"}
        </div>
      </div>
      <div className="p-4 space-y-2.5">
        <div>
          <p className="font-bold text-[#0F2830] text-base">
            {listing.breed} {listing.age < 12 ? t.marketplace.puppy : ""}
          </p>
          <p className="text-stone-500 text-sm">{t.marketplace.species[listing.species]} • {formatAge(listing.age, t.marketplace.units)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {listing.vaccinated && (
            <span className="inline-flex items-center gap-1 text-xs text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full">
              ✓ {t.marketplace.vaccinated}
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
