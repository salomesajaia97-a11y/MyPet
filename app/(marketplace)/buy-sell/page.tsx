import { Suspense } from "react";
import { MarketplaceTabs } from "@/components/marketplace/MarketplaceTabs";
import { MarketplaceSearch } from "@/components/marketplace/MarketplaceSearch";
import type { BuySellListing } from "@/types/marketplace";

const MOCK: BuySellListing[] = [
  {
    _id: "1", type: "buy-sell", species: "dog", breed: "Golden Retriever", age: 3,
    images: ["https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop"],
    description: "ჯანმრთელი ლეკვი", location: "თბილისი, ვაკე",
    contactName: "გიორგი", contactPhone: "+995 555 000 000",
    createdAt: new Date().toISOString(), userId: "u1",
    price: 2500, currency: "GEL", vaccinated: true, hasPassport: true, pedigree: "FCI",
  },
  {
    _id: "2", type: "buy-sell", species: "dog", breed: "Border Collie", age: 2,
    images: ["https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=800&auto=format&fit=crop"],
    description: "ლეკვები", location: "თბილისი, საბურთალო",
    contactName: "ნინო", contactPhone: "+995 555 111 111",
    createdAt: new Date().toISOString(), userId: "u2",
    price: 2000, currency: "GEL", vaccinated: true, hasPassport: true, pedigree: "FCG",
  },
];

export default function BuySellPage() {
  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <Suspense fallback={null}>
          <MarketplaceTabs active="buy-sell" />
          <MarketplaceSearch />
        </Suspense>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MOCK.map((listing) => (
            <FigmaListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      </div>
      <FigmaFAB />
    </div>
  );
}

function FigmaListingCard({ listing }: { listing: BuySellListing }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
      <div className="relative aspect-[4/3] bg-stone-100">
        {listing.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.images[0]} alt={listing.breed} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🐾</div>
        )}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-sm font-bold text-[#1C1917]">
          {listing.price.toLocaleString()}₾
        </div>
      </div>
      <div className="p-4 space-y-2.5">
        <div>
          <p className="font-bold text-[#1C1917] text-base">{listing.breed} {listing.age < 12 ? "ლეკვი" : ""}</p>
          <p className="text-stone-500 text-sm">{listing.breed} • {listing.age}თვე</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {listing.vaccinated && (
            <span className="inline-flex items-center gap-1 text-xs text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full">
              ✏ ვაქცინირებული
            </span>
          )}
          {listing.pedigree !== "none" && (
            <span className="inline-flex items-center gap-1 text-xs text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full">
              👤 პედიგრი
            </span>
          )}
        </div>
        <p className="text-sm text-stone-500 flex items-center gap-1">
          <span>📍</span> {listing.location}
        </p>
      </div>
    </div>
  );
}

function FigmaFAB() {
  return (
    <button className="fixed bottom-6 right-6 w-14 h-14 bg-[#6B5240] text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-[#5a4435] transition-colors z-50">
      +
    </button>
  );
}
