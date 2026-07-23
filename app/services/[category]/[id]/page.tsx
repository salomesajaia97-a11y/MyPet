import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, MapPin, Phone, Globe, Clock, ArrowLeft } from "lucide-react";
import PhoneLink from "@/components/ui/PhoneLink";
import ServiceReviews from "@/components/services/ServiceReviews";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import BusinessModel from "@/lib/models/Business";
import { auth } from "@/auth";
import ServiceOwnerControls from "@/components/services/ServiceOwnerControls";
import { getServerDictionary } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

interface Service {
  _id: string;
  name: string;
  category: "vet-clinics" | "pet-hotels" | "pet-shops" | "pet-friendly";
  description?: string;
  address: string;
  neighborhood?: string;
  city?: string;
  phone?: string;
  website?: string;
  images?: string[];
  tags?: string[];
  is24h?: boolean;
  hasEmergency?: boolean;
  openingHours?: string[];
  aggregateRating?: number;
  nativeRatingCount?: number;
  pricePerNight?: number;
  lat?: number;
  lng?: number;
  userId?: string;
  status?: "pending" | "approved";
}

// Href per category; the back-link label comes from the dictionary
// (t.services.detail.back[...]) so it follows the active locale.
const CATEGORY_HREF: Record<string, string> = {
  "vet-clinics": "/services/vet-clinics",
  "pet-hotels": "/services/pet-hotels",
  "pet-shops": "/services/pet-shops",
  "pet-friendly": "/services/pet-friendly",
};

const CATEGORY_BACK_KEY: Record<
  string,
  keyof Awaited<ReturnType<typeof getServerDictionary>>["t"]["services"]["detail"]["back"]
> = {
  "vet-clinics": "vetClinics",
  "pet-hotels": "petHotels",
  "pet-shops": "petShops",
  "pet-friendly": "petFriendly",
};

// Query the DB directly instead of self-fetching our own API (no absolute-URL
// dependency). Serialize the lean doc to plain JSON for the client boundary.
// cache() so generateMetadata + the page share one query per request.
const getService = cache(async (
  category: string,
  id: string
): Promise<Service | null> => {
  if (!isValidObjectId(id)) return null;
  try {
    await connectDB();
    const doc = await BusinessModel.findOne({ _id: id, category }).lean();
    return doc ? (JSON.parse(JSON.stringify(doc)) as Service) : null;
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: PageProps<"/services/[category]/[id]">): Promise<Metadata> {
  const { category, id } = await params;
  const t = getDictionary(await getServerLocale());
  const service = await getService(category, id);
  // Don't emit a real title for a missing OR still-pending business (pending
  // ones aren't public — don't leak the name to crawlers).
  if (!service || service.status === "pending") {
    return { title: t.services.edit.notFound };
  }

  const title = service.name;
  const description =
    service.description?.trim().slice(0, 160) ||
    [service.address, service.neighborhood, service.city].filter(Boolean).join(", ");
  const image = service.images?.[0];

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

export default async function ServiceDetailPage({
  params,
}: PageProps<"/services/[category]/[id]">) {
  const { category, id } = await params;
  const { t } = await getServerDictionary();
  const backHref = CATEGORY_HREF[category];
  if (!backHref) notFound();
  const backLabel = t.services.detail.back[CATEGORY_BACK_KEY[category]];

  const service = await getService(category, id);
  if (!service) notFound();

  const session = await auth();
  const isOwner =
    !!session?.user?.id && service.userId === session.user.id;
  const isAdmin = session?.user?.role === "admin";

  // A pending business is private: only its owner or an admin may view it by
  // direct URL. Everyone else gets a 404 (it isn't public until approved).
  if (service.status === "pending" && !isOwner && !isAdmin) {
    notFound();
  }

  const address = [service.address, service.neighborhood, service.city]
    .filter(Boolean)
    .join(", ");

  // Real ratings only: show the badge solely when genuine native reviews exist.
  const nativeCount = service.nativeRatingCount ?? 0;

  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Back */}
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-[#0E4A5C] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Link>

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {/* Hero image */}
          <div className="relative aspect-[16/9] bg-stone-100">
            {service.images?.[0] ? (
              // Raw <img>: a business detail page may be a scraped directory
              // entry whose image is on an external host not in remotePatterns,
              // which next/image would reject. User-uploaded ones are Cloudinary
              // but we can't tell them apart here, so stay unoptimized.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={service.images[0]}
                alt={service.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">
                🐾
              </div>
            )}
            {service.is24h && (
              <div className="absolute top-3 left-3 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" /> 24/7
              </div>
            )}
          </div>

          <div className="p-6 space-y-5">
            {(isOwner || isAdmin) && (
              <div className="space-y-3 border border-[#0E4A5C]/15 bg-[#EBF6FA] rounded-xl p-4">
                {service.status === "pending" && (
                  <p className="text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    {t.services.detail.pendingNotice}
                  </p>
                )}
                <ServiceOwnerControls category={service.category} id={service._id} />
              </div>
            )}

            {/* Title + rating */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-bold text-[#0F2830]">{service.name}</h1>
                {service.pricePerNight && (
                  <span className="shrink-0 text-sm font-bold text-[#0E4A5C] bg-[#0E4A5C]/10 px-3 py-1 rounded-full">
                    {service.pricePerNight}{t.services.perNight}
                  </span>
                )}
              </div>
              {nativeCount > 0 && typeof service.aggregateRating === "number" && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{service.aggregateRating}</span>
                  <span className="text-stone-400 text-xs">
                    ({nativeCount} {t.services.reviewWord})
                  </span>
                </div>
              )}
            </div>

            {/* Tags */}
            {service.tags && service.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {service.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-stone-100 text-stone-600 px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {service.description && (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#0F2830]">{t.services.detail.description}</p>
                <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                  {service.description}
                </p>
              </div>
            )}

            {/* Opening hours */}
            {service.openingHours && service.openingHours.length > 0 && (
              <div className="space-y-2 border-t pt-5">
                <p className="text-sm font-semibold text-[#0F2830] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-stone-400" />
                  {t.services.detail.openingHours}
                </p>
                <ul className="space-y-0.5">
                  {service.openingHours.map((line, i) => (
                    <li key={i} className="text-sm text-stone-600">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contact */}
            <div className="border-t pt-5 space-y-3">
              {address && (
                <p className="text-sm text-stone-600 flex items-start gap-2">
                  <MapPin className="w-4 h-4 shrink-0 text-stone-400 mt-0.5" />
                  {address}
                </p>
              )}
              {typeof service.lat === "number" && typeof service.lng === "number" && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${service.lat},${service.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#0E4A5C] flex items-center gap-2 hover:underline"
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  {t.services.detail.viewOnMap}
                </a>
              )}
              {service.website && (
                <a
                  href={service.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-stone-500 flex items-center gap-2 hover:text-[#0E4A5C] transition-colors"
                >
                  <Globe className="w-4 h-4 shrink-0" />
                  {t.services.website}
                </a>
              )}
              {service.phone && (
                <PhoneLink
                  phone={service.phone}
                  className="flex items-center justify-center gap-2 w-full bg-[#0E4A5C] hover:bg-[#0B3D4E] text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {service.phone}
                </PhoneLink>
              )}
            </div>
          </div>
        </div>

        {/* Reviews & ratings */}
        <ServiceReviews businessId={service._id} ownerId={service.userId} />
      </div>
    </div>
  );
}
