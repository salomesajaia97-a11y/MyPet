import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Phone, User, Calendar, ArrowLeft } from "lucide-react";
import type { Listing } from "@/types/marketplace";
import { OwnerControls } from "./OwnerControls";

async function getListing(id: string): Promise<Listing | null> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/marketplace/listing/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const { listing } = await res.json();
    return listing ?? null;
  } catch {
    return null;
  }
}

const typeLabels: Record<string, string> = {
  "buy-sell": "გაყიდვა",
  adoption: "გაჩუქება",
  mating: "შეჯვარება",
  "lost-found": "დაკარგული/ნაპოვნი",
};

const backHref: Record<string, string> = {
  "buy-sell": "/buy-sell",
  adoption: "/adoption",
  mating: "/mating",
  "lost-found": "/lost-found",
};

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) notFound();

  // TODO: replace with a real session check (compare listing.userId to the
  // logged-in user id). Hardcoded for now to inspect the owner layout.
  const isOwner = true;

  const ageLabel =
    listing.age < 12
      ? `${listing.age} თვე`
      : `${Math.floor(listing.age / 12)} წელი`;

  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Back button */}
        <Link
          href={backHref[listing.type] ?? "/buy-sell"}
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-[#0E4A5C] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          უკან დაბრუნება
        </Link>

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {/* Image gallery */}
          <div className="relative aspect-[16/9] bg-stone-100">
            {listing.images[0] ? (
              <Image
                src={listing.images[0]}
                alt={listing.breed}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">
                🐾
              </div>
            )}
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-[#0F2830]">
              {typeLabels[listing.type]}
            </div>
            {listing.type === "buy-sell" && (
              <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-base font-bold text-[#0F2830]">
                {listing.price.toLocaleString()} ₾
              </div>
            )}
            {listing.type === "mating" && listing.price !== null && (
              <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-base font-bold text-[#0F2830]">
                {listing.price.toLocaleString()} ₾
              </div>
            )}
          </div>

          {/* Extra images */}
          {listing.images.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto">
              {listing.images.slice(1).map((src, i) => (
                <div
                  key={i}
                  className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-stone-100"
                >
                  <Image src={src} alt={`photo ${i + 2}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="p-6 space-y-5">
            {/* Title row */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#0F2830]">
                  {listing.breed}
                  {listing.age < 12 ? " ლეკვი" : ""}
                </h1>
              </div>
              <div className="flex flex-col items-end gap-1 text-sm text-stone-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {ageLabel}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {listing.location}
                </span>
              </div>
            </div>

            {/* Type-specific badges */}
            {listing.type === "buy-sell" && (
              <div className="flex flex-wrap gap-2">
                {listing.vaccinated && (
                  <span className="inline-flex items-center gap-1 text-xs bg-stone-100 text-stone-700 px-3 py-1 rounded-full">
                    ✓ ვაქცინირებული
                  </span>
                )}
                {listing.hasPassport && (
                  <span className="inline-flex items-center gap-1 text-xs bg-stone-100 text-stone-700 px-3 py-1 rounded-full">
                    📋 პასპორტი
                  </span>
                )}
                {listing.pedigree !== "none" && (
                  <span className="inline-flex items-center gap-1 text-xs bg-stone-100 text-stone-700 px-3 py-1 rounded-full">
                    🏆 {listing.pedigree}
                  </span>
                )}
              </div>
            )}

            {listing.type === "adoption" && (
              <div className="flex flex-wrap gap-2">
                {listing.spayedNeutered && (
                  <span className="text-xs bg-stone-100 text-stone-700 px-3 py-1 rounded-full">
                    კასტრირებული
                  </span>
                )}
                {listing.goodWithKids && (
                  <span className="text-xs bg-stone-100 text-stone-700 px-3 py-1 rounded-full">
                    ბავშვებთან კარგად
                  </span>
                )}
                {listing.goodWithPets && (
                  <span className="text-xs bg-stone-100 text-stone-700 px-3 py-1 rounded-full">
                    ცხოველებთან კარგად
                  </span>
                )}
                {listing.temperament.map((t) => (
                  <span key={t} className="text-xs bg-stone-100 text-stone-700 px-3 py-1 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            )}

            {listing.type === "mating" && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-stone-100 text-stone-700 px-3 py-1 rounded-full">
                  {listing.sex === "male" ? "♂ მამრი" : "♀ მდედრი"}
                </span>
                <span className="text-xs bg-stone-100 text-stone-700 px-3 py-1 rounded-full">
                  {listing.weight} კგ
                </span>
                {listing.pedigree !== "none" && (
                  <span className="text-xs bg-stone-100 text-stone-700 px-3 py-1 rounded-full">
                    🏆 {listing.pedigree}
                  </span>
                )}
              </div>
            )}

            {listing.type === "lost-found" && (
              <div className="flex flex-wrap gap-2">
                <span
                  className={`text-xs px-3 py-1 rounded-full ${
                    listing.status === "lost"
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {listing.status === "lost" ? "დაკარგული" : "ნაპოვნი"}
                </span>
                <span className="text-xs bg-stone-100 text-stone-700 px-3 py-1 rounded-full">
                  📍 {listing.neighborhood}
                </span>
                {listing.reward !== null && listing.reward > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
                    ჯილდო: {listing.reward} ₾
                  </span>
                )}
                {listing.isResolved && (
                  <span className="text-xs bg-stone-200 text-stone-500 px-3 py-1 rounded-full">
                    მოგვარებული
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            {listing.description && (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#0F2830]">აღწერა</p>
                <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Owner sees management controls; everyone else sees the buyer
                contact block. */}
            {isOwner ? (
              <OwnerControls
                id={id}
                backHref={backHref[listing.type] ?? "/buy-sell"}
              />
            ) : (
              <div className="border-t pt-5 space-y-3">
                <p className="text-sm font-semibold text-[#0F2830]">კონტაქტი</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#EBF6FA] rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-[#0E4A5C]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#0F2830]">{listing.contactName}</p>
                    <p className="text-sm text-stone-500">{listing.contactPhone}</p>
                  </div>
                </div>
                <a
                  href={`tel:${listing.contactPhone}`}
                  className="flex items-center justify-center gap-2 w-full bg-[#0E4A5C] hover:bg-[#0B3D4E] text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  დარეკვა
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
