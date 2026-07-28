"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Sparkles } from "lucide-react";
import type { Listing } from "@/types/marketplace";
import { useT } from "@/components/i18n/LanguageProvider";
import { PromoteDialog } from "@/components/vip/PromoteDialog";
import { isVipActive } from "@/lib/marketplace/vip";
import { formatPrice } from "@/lib/marketplace/format";

export default function MyListingsPage() {
  const { t } = useT();
  const router = useRouter();
  const { status } = useSession();
  const [listings, setListings] = useState<Listing[] | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile/listings")
      .then((r) => r.json())
      .then(({ listings }) => setListings(listings ?? []))
      .catch(() => setListings([]));
  }, [status]);

  return (
    <div className="min-h-screen bg-[#EBF6FA] py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#0F2830]">{t.profile.listings.title}</h1>
          <Link
            href="/listings/new"
            className="flex items-center gap-1.5 border border-[#0E4A5C] text-[#0E4A5C] hover:bg-[#0E4A5C] hover:text-white transition-all rounded-lg px-4 py-2 text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            {t.common.actions.add}
          </Link>
        </div>

        {listings === null ? (
          <div className="py-20 text-center text-stone-400 text-sm">{t.common.actions.loading}</div>
        ) : listings.length === 0 ? (
          <div className="py-20 text-center text-stone-400 text-sm">
            {t.profile.listings.empty}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  const { t } = useT();
  const [promoteOpen, setPromoteOpen] = useState(false);
  const vip = isVipActive(listing);
  // Only buy-sell carries a currency; a mating fee is always in GEL. The card
  // used to print ₾ on both, so a listing priced in dollars showed the wrong
  // symbol here while every other surface showed $.
  const price =
    listing.type === "buy-sell"
      ? formatPrice(listing.price, listing.currency)
      : listing.type === "mating"
        ? formatPrice(listing.price)
        : null;

  return (
    <div>
      {/* The promote button lives outside the Link — a button nested inside an
          anchor is not valid interactive markup. */}
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
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold text-[#0F2830]">
            {t.profile.listings.types[listing.type]}
          </div>
          {price && (
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-sm font-bold text-[#0F2830]">
              {price}
            </div>
          )}
        </div>
        <div className="p-4 space-y-1.5">
          <p className="font-bold text-[#0F2830] text-base">{listing.breed}</p>
          <p className="text-sm text-stone-500 flex items-center gap-1">
            <span>📍</span> {listing.location}
          </p>
        </div>
      </div>
      </Link>

      <button
        type="button"
        onClick={() => setPromoteOpen(true)}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 py-2 text-xs font-bold text-white hover:bg-amber-600"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {vip ? t.listings.owner.extend : t.listings.owner.promote}
      </button>
      <PromoteDialog
        listingId={listing._id}
        open={promoteOpen}
        onClose={() => setPromoteOpen(false)}
      />
    </div>
  );
}
