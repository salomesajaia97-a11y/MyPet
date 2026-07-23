import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Phone, User, Calendar, ArrowLeft, Star } from "lucide-react";
import PhoneLink from "@/components/ui/PhoneLink";
import type { Listing } from "@/types/marketplace";
import { auth } from "@/auth";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import ListingModel from "@/lib/models/Listing";
import { OwnerControls } from "./OwnerControls";
import { ContactSellerBox } from "./ContactSellerBox";
import Gallery from "./Gallery";
import { isVipActive } from "@/lib/marketplace/vip";
import { getServerDictionary } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

// Query the DB directly — no self-fetch to our own API (which would need an
// absolute URL and break outside localhost). JSON round-trip serializes
// ObjectIds/Dates to plain strings so `userId` compares cleanly to the session.
// Wrapped in React cache() so generateMetadata + the page share ONE query per
// request instead of hitting the DB twice.
const getListing = cache(async (id: string): Promise<Listing | null> => {
  if (!isValidObjectId(id)) return null;
  try {
    await connectDB();
    const doc = await ListingModel.findById(id).lean();
    return doc ? (JSON.parse(JSON.stringify(doc)) as Listing) : null;
  } catch {
    return null;
  }
});

const backHref: Record<string, string> = {
  "buy-sell": "/buy-sell",
  adoption: "/adoption",
  mating: "/mating",
  "lost-found": "/lost-found",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  const t = getDictionary(await getServerLocale());
  if (!listing) return { title: t.listings.editListing.notFound };

  const typeLabels: Record<string, string> = {
    "buy-sell": t.listings.types.buySell,
    adoption: t.listings.types.adoption,
    mating: t.listings.types.mating,
    "lost-found": t.listings.types.lostFound,
  };
  const title = `${listing.breed} — ${typeLabels[listing.type] ?? ""}`.trim();
  const description =
    listing.description?.trim().slice(0, 160) ||
    `${typeLabels[listing.type] ?? ""} · ${listing.location}`;
  const image = listing.images?.[0];

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) notFound();

  const { t } = await getServerDictionary();
  const typeLabels: Record<string, string> = {
    "buy-sell": t.listings.types.buySell,
    adoption: t.listings.types.adoption,
    mating: t.listings.types.mating,
    "lost-found": t.listings.types.lostFound,
  };

  // The owner sees management controls; everyone else sees the contact block.
  const session = await auth();
  const isOwner =
    !!listing.userId && !!session?.user?.id && listing.userId === session.user.id;
  const vip = isVipActive(listing);

  const ageLabel =
    listing.age < 12
      ? `${listing.age} ${t.listings.detail.monthUnit}`
      : `${Math.floor(listing.age / 12)} ${t.listings.detail.yearUnit}`;

  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Back button */}
        <Link
          href={backHref[listing.type] ?? "/buy-sell"}
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-[#0E4A5C] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.listings.detail.back}
        </Link>

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {/* Image gallery */}
          <Gallery images={listing.images} alt={listing.breed}>
            <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
              <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-[#0F2830]">
                {typeLabels[listing.type]}
              </span>
              {vip && (
                <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-black text-amber-600">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  VIP
                </span>
              )}
            </div>
            {listing.type === "buy-sell" && (
              <div className="absolute bottom-3 right-3 pointer-events-none bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-base font-bold text-[#0F2830]">
                {listing.currency === "USD"
                  ? `$${listing.price.toLocaleString()}`
                  : `${listing.price.toLocaleString()} ₾`}
              </div>
            )}
            {listing.type === "mating" && listing.price !== null && (
              <div className="absolute bottom-3 right-3 pointer-events-none bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-base font-bold text-[#0F2830]">
                {listing.price.toLocaleString()} ₾
              </div>
            )}
          </Gallery>

          <div className="p-6 space-y-5">
            {/* Title row */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#0F2830]">
                  {listing.breed}
                  {listing.age < 12 ? ` ${t.listings.detail.puppy}` : ""}
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
                    ✓ {t.listings.form.vaccinated}
                  </span>
                )}
                {listing.hasPassport && (
                  <span className="inline-flex items-center gap-1 text-xs bg-stone-100 text-stone-700 px-3 py-1 rounded-full">
                    📋 {t.listings.form.passport}
                  </span>
                )}
              </div>
            )}

            {listing.type === "adoption" && (
              <div className="flex flex-wrap gap-2">
                {listing.spayedNeutered && (
                  <span className="text-xs bg-stone-100 text-stone-700 px-3 py-1 rounded-full">
                    {t.listings.detail.neutered}
                  </span>
                )}
                {listing.goodWithKids && (
                  <span className="text-xs bg-stone-100 text-stone-700 px-3 py-1 rounded-full">
                    {t.listings.detail.goodWithKids}
                  </span>
                )}
                {listing.goodWithPets && (
                  <span className="text-xs bg-stone-100 text-stone-700 px-3 py-1 rounded-full">
                    {t.listings.detail.goodWithPets}
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
                  {listing.sex === "male"
                    ? `♂ ${t.listings.form.male}`
                    : `♀ ${t.listings.form.female}`}
                </span>
                <span className="text-xs bg-stone-100 text-stone-700 px-3 py-1 rounded-full">
                  {listing.weight} {t.listings.detail.kgUnit}
                </span>
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
                  {listing.status === "lost" ? t.listings.form.lost : t.listings.form.found}
                </span>
                <span className="text-xs bg-stone-100 text-stone-700 px-3 py-1 rounded-full">
                  📍 {listing.neighborhood}
                </span>
                {listing.reward !== null && listing.reward > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
                    {t.listings.detail.reward}: {listing.reward} ₾
                  </span>
                )}
                {listing.isResolved && (
                  <span className="text-xs bg-stone-200 text-stone-500 px-3 py-1 rounded-full">
                    {t.listings.detail.resolved}
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            {listing.description && (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#0F2830]">{t.listings.detail.description}</p>
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
                isVip={vip}
              />
            ) : (
              <div className="border-t pt-5 space-y-3">
                <p className="text-sm font-semibold text-[#0F2830]">{t.listings.detail.contact}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#EBF6FA] rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-[#0E4A5C]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#0F2830]">{listing.contactName}</p>
                    <p className="text-sm text-stone-500">{listing.contactPhone}</p>
                  </div>
                </div>
                <PhoneLink
                  phone={listing.contactPhone}
                  className="flex items-center justify-center gap-2 w-full bg-[#0E4A5C] hover:bg-[#0B3D4E] text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {t.listings.detail.call}
                </PhoneLink>
                {listing.userId && <ContactSellerBox listingId={id} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
