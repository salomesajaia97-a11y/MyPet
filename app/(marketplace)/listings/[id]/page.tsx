import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Phone, User, Calendar, ArrowLeft, Star, Tag } from "lucide-react";
import PhoneLink from "@/components/ui/PhoneLink";
import type { Listing } from "@/types/marketplace";
import { auth } from "@/auth";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import ListingModel from "@/lib/models/Listing";
import { OwnerControls } from "./OwnerControls";
import { ContactSellerBox } from "./ContactSellerBox";
import Gallery from "./Gallery";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { ViewCounter } from "./ViewCounter";
import { isVipActive } from "@/lib/marketplace/vip";
import { formatPrice } from "@/lib/marketplace/format";
import { formatPublishedDate, shortListingId } from "@/lib/marketplace/views";
import { getServerDictionary } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, graph, ORGANIZATION_ID, WEBSITE_ID } from "@/lib/seo/jsonLd";
import { SITE_URL } from "@/lib/siteUrl";
import {
  ADOPTION_KEYWORDS,
  BRAND_KEYWORDS,
  BUY_SELL_KEYWORDS,
  buildKeywords,
  LOST_FOUND_KEYWORDS,
  MATING_KEYWORDS,
} from "@/lib/seo/keywords";

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

/** Intent keywords per listing type — the breed and city are prepended live. */
const KEYWORDS_BY_TYPE: Record<string, string[]> = {
  "buy-sell": BUY_SELL_KEYWORDS.slice(0, 18),
  adoption: ADOPTION_KEYWORDS.slice(0, 18),
  mating: MATING_KEYWORDS.slice(0, 14),
  "lost-found": LOST_FOUND_KEYWORDS.slice(0, 18),
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  // A deleted or bogus id must not be indexed — it would otherwise ship a
  // soft-404 with a real canonical URL.
  if (!listing) {
    return { title: t.listings.editListing.notFound, robots: { index: false, follow: false } };
  }

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

  return pageMetadata({
    locale,
    title,
    description,
    path: `/listings/${id}`,
    type: "article",
    images: listing.images?.length ? listing.images : undefined,
    // The breed and location are what people actually type; they lead, with
    // the section's intent terms behind them.
    keywords: buildKeywords(
      [
        listing.breed,
        `${listing.breed} ${listing.location}`,
        listing.location,
        `${typeLabels[listing.type] ?? ""} ${listing.breed}`.trim(),
      ],
      KEYWORDS_BY_TYPE[listing.type] ?? [],
      BRAND_KEYWORDS.slice(0, 5),
    ),
  });
}

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ promote?: string }>;
}) {
  const { id } = await params;
  // `?promote=1` comes from the post-create redirect — open the picker straight
  // away, at the moment the owner most wants visibility.
  const { promote } = await searchParams;
  const listing = await getListing(id);
  if (!listing) notFound();

  const { t, locale } = await getServerDictionary();
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

  // Price chip on the photo — only the two priced sections have one. A mating
  // post without a price is offered free, and a row missing one entirely (older
  // than the create-time check) renders no chip instead of throwing.
  const priceLabel =
    listing.type === "buy-sell"
      ? formatPrice(listing.price, listing.currency, { spaced: true })
      : listing.type === "mating"
        ? formatPrice(listing.price, null, { spaced: true })
        : null;

  const url = `${SITE_URL}/listings/${id}`;
  const sectionHref = backHref[listing.type] ?? "/buy-sell";

  // A lost/found post is an announcement, not something for sale — emitting it
  // as a Product would be a structured-data policy violation. Everything else
  // is a real offer (adoption is simply priced at 0).
  const priced =
    listing.type === "buy-sell" || listing.type === "mating"
      ? typeof listing.price === "number"
        ? listing.price
        : 0
      : listing.type === "adoption"
        ? 0
        : null;

  const mainEntity =
    listing.type === "lost-found"
      ? {
          "@type": "Article",
          "@id": `${url}#listing`,
          url,
          headline: `${listing.breed} — ${typeLabels[listing.type]}`,
          ...(listing.images?.length ? { image: listing.images } : {}),
          ...(listing.description ? { articleBody: listing.description } : {}),
          datePublished: listing.createdAt,
          inLanguage: locale === "en" ? "en" : "ka",
          contentLocation: {
            "@type": "Place",
            name: [listing.neighborhood, listing.location].filter(Boolean).join(", "),
          },
          publisher: { "@id": ORGANIZATION_ID },
          isPartOf: { "@id": WEBSITE_ID },
        }
      : {
          "@type": "Product",
          "@id": `${url}#listing`,
          url,
          name: listing.breed,
          sku: listing._id,
          category: typeLabels[listing.type],
          ...(listing.images?.length ? { image: listing.images } : {}),
          ...(listing.description ? { description: listing.description } : {}),
          additionalProperty: [
            { "@type": "PropertyValue", name: "species", value: listing.species },
            { "@type": "PropertyValue", name: "breed", value: listing.breed },
            { "@type": "PropertyValue", name: "ageMonths", value: listing.age },
          ],
          offers: {
            "@type": "Offer",
            url,
            price: priced,
            priceCurrency:
              listing.type === "buy-sell" && listing.currency === "USD" ? "USD" : "GEL",
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
            areaServed: { "@type": "Place", name: listing.location },
            seller: { "@type": "Person", name: listing.contactName },
          },
        };

  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <JsonLd
        data={graph(
          mainEntity,
          breadcrumbJsonLd([
            { name: t.seo.breadcrumbs.home, path: "/" },
            { name: typeLabels[listing.type] ?? t.seo.breadcrumbs.listings, path: sectionHref },
            { name: listing.breed, path: `/listings/${id}` },
          ]),
        )}
      />
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
            {/* Same heart as the cards, sized up for the detail view. Rendered
                after the badges so it paints above the full-image zoom button
                and receives the click itself. */}
            <FavoriteButton
              listingId={id}
              iconClassName="w-5 h-5"
              className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow"
            />
            {priceLabel && (
              <div className="absolute bottom-3 right-3 pointer-events-none bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-base font-bold text-[#0F2830]">
                {priceLabel}
              </div>
            )}
          </Gallery>

          <div className="p-4 sm:p-6 space-y-5">
            {/* Title row — stacks on phones so neither the title nor the
                age/location pair has to wrap inside a half-width column. */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-[#0F2830] break-words">
                  {listing.breed}
                  {listing.age < 12 ? ` ${t.listings.detail.puppy}` : ""}
                </h1>
              </div>
              <div className="flex flex-row flex-wrap sm:flex-col items-start sm:items-end gap-x-4 gap-y-1 text-sm text-stone-500 sm:shrink-0">
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

            {/* Posting facts: when it went up, its reference number, and how
                many people have opened it. Kept between hairlines so it reads
                as metadata about the ad rather than about the animal. */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-stone-100 py-3 text-sm text-stone-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {t.listings.detail.published} {formatPublishedDate(listing.createdAt, locale)}
              </span>
              <span className="flex items-center gap-1.5">
                <Tag className="w-4 h-4" />
                {t.listings.detail.listingId} #{shortListingId(id)}
              </span>
              <ViewCounter listingId={id} initialViews={listing.views ?? 0} />
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
                vipUntil={listing.vipUntil ?? null}
                type={listing.type}
                isResolved={listing.type === "lost-found" ? listing.isResolved : false}
                autoPromote={promote === "1"}
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
