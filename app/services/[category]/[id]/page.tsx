import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, MapPin, Phone, Globe, Clock, ArrowLeft } from "lucide-react";
import PhoneLink from "@/components/ui/PhoneLink";

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
  googleRatingCount?: number;
  pricePerNight?: number;
  lat?: number;
  lng?: number;
}

const CATEGORY_META: Record<
  string,
  { label: string; href: string }
> = {
  "vet-clinics": { label: "ვეტ კლინიკები", href: "/services/vet-clinics" },
  "pet-hotels": { label: "ცხოველთა სასტუმროები", href: "/services/pet-hotels" },
  "pet-shops": { label: "პეტ შოპები", href: "/services/pet-shops" },
  "pet-friendly": { label: "Pet-Friendly ადგილები", href: "/services/pet-friendly" },
};

async function getService(
  category: string,
  id: string
): Promise<Service | null> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/services/${category}/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const { service } = await res.json();
    return service ?? null;
  } catch {
    return null;
  }
}

export default async function ServiceDetailPage({
  params,
}: PageProps<"/services/[category]/[id]">) {
  const { category, id } = await params;
  const meta = CATEGORY_META[category];
  if (!meta) notFound();

  const service = await getService(category, id);
  if (!service) notFound();

  const address = [service.address, service.neighborhood, service.city]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Back */}
        <Link
          href={meta.href}
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-[#0E4A5C] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {meta.label}
        </Link>

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {/* Hero image */}
          <div className="relative aspect-[16/9] bg-stone-100">
            {service.images?.[0] ? (
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
            {/* Title + rating */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-bold text-[#0F2830]">{service.name}</h1>
                {service.pricePerNight && (
                  <span className="shrink-0 text-sm font-bold text-[#0E4A5C] bg-[#0E4A5C]/10 px-3 py-1 rounded-full">
                    {service.pricePerNight}₾/ღამე
                  </span>
                )}
              </div>
              {typeof service.aggregateRating === "number" &&
                service.aggregateRating > 0 && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">{service.aggregateRating}</span>
                    {service.googleRatingCount ? (
                      <span className="text-stone-400 text-xs">
                        ({service.googleRatingCount} შეფასება)
                      </span>
                    ) : null}
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
                <p className="text-sm font-semibold text-[#0F2830]">აღწერა</p>
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
                  სამუშაო საათები
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
                  რუკაზე ნახვა
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
                  ვებ-გვერდი
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
      </div>
    </div>
  );
}
