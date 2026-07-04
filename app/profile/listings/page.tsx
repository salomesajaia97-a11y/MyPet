"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Listing } from "@/types/marketplace";

const TYPE_LABELS: Record<Listing["type"], string> = {
  "buy-sell": "გაყიდვა",
  adoption: "გაჩუქება",
  mating: "შეჯვარება",
  "lost-found": "დაკარგული/ნაპოვნი",
};

export default function MyListingsPage() {
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
          <h1 className="text-2xl font-bold text-[#0F2830]">ჩემი განცხადებები</h1>
          <Link
            href="/listings/new"
            className="flex items-center gap-1.5 border border-[#0E4A5C] text-[#0E4A5C] hover:bg-[#0E4A5C] hover:text-white transition-all rounded-lg px-4 py-2 text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            დამატება
          </Link>
        </div>

        {listings === null ? (
          <div className="py-20 text-center text-stone-400 text-sm">იტვირთება...</div>
        ) : listings.length === 0 ? (
          <div className="py-20 text-center text-stone-400 text-sm">
            ჯერ არ გაქვთ განცხადებები.
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
  const price =
    (listing.type === "buy-sell" || listing.type === "mating") &&
    listing.price !== null &&
    listing.price !== undefined
      ? `${listing.price.toLocaleString()}₾`
      : null;

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
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold text-[#0F2830]">
            {TYPE_LABELS[listing.type]}
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
  );
}
