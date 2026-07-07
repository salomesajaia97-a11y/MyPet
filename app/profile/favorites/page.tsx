import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin } from "lucide-react";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import UserModel from "@/lib/models/User";
import "@/lib/models/Listing";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import type { Listing } from "@/types/marketplace";

export const dynamic = "force-dynamic";

const SPECIES_KA: Record<string, string> = {
  dog: "ძაღლი",
  cat: "კატა",
  bird: "ფრინველი",
  rabbit: "კურდღელი",
  reptile: "რეპტილია",
  other: "სხვა",
};

function priceLabel(l: Listing): string {
  if (l.type === "adoption") return "ჩუქდება";
  if (l.type === "lost-found") return "";
  const price = "price" in l && typeof l.price === "number" ? l.price : null;
  if (price === null) return "";
  const usd = "currency" in l && l.currency === "USD";
  return usd ? `$${price.toLocaleString()}` : `${price.toLocaleString()} ₾`;
}

export default async function FavoritesPage() {
  const session = await auth();
  // /profile/* is gated by proxy, so a session is guaranteed here.
  await connectDB();
  const user = await UserModel.findById(session!.user.id)
    .select("favorites")
    .populate({ path: "favorites", options: { sort: { createdAt: -1 } } })
    .lean();

  const listings: Listing[] = JSON.parse(
    JSON.stringify(user?.favorites ?? [])
  );

  return (
    <div className="min-h-screen bg-[#EBF6FA] py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-[#0F2830] mb-6 flex items-center gap-2">
          <Heart className="w-6 h-6 fill-rose-500 text-rose-500" />
          ფავორიტები
        </h1>

        {listings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center space-y-3">
            <div className="text-4xl">🤍</div>
            <p className="text-stone-500 text-sm">ჯერ არაფერი დაგიმატებია ფავორიტებში.</p>
            <Link
              href="/buy-sell"
              className="inline-block bg-[#0E4A5C] hover:bg-[#0B3D4E] text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              განცხადებების დათვალიერება
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((l) => (
              <div key={l._id} className="relative">
                <Link
                  href={`/listings/${l._id}`}
                  className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  <div className="relative aspect-[4/3] bg-stone-100">
                    {l.images?.[0] ? (
                      <Image
                        src={l.images[0]}
                        alt={l.breed}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🐾</div>
                    )}
                  </div>
                  <div className="p-4 space-y-1">
                    {priceLabel(l) && (
                      <p className="font-black text-[#0F2830] text-base">{priceLabel(l)}</p>
                    )}
                    <p className="text-sm text-stone-600 font-medium">{l.breed}</p>
                    <p className="text-xs text-stone-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {(l.location ?? "").split(",")[0].trim()} · {SPECIES_KA[l.species] ?? l.species}
                    </p>
                  </div>
                </Link>
                <FavoriteButton
                  listingId={l._id}
                  className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-all shadow"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
