"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Search,
  ChevronDown,
  MapPin,
  Rocket,
  TrendingUp,
  PawPrint,
  Stethoscope,
  Gift,
  AlertCircle,
  Star,
  Plus,
  ArrowRight,
  ShoppingBag,
  HeartHandshake,
  Hotel,
  Store,
  Cake,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { SmartSearch } from "@/components/ai/SmartSearch";
import { useT } from "@/components/i18n/LanguageProvider";
import { CITIES, SPECIES as SPECIES_OPTIONS } from "@/lib/marketplace/filters";
import { isVipActive } from "@/lib/marketplace/vip";
import type { Listing } from "@/types/marketplace";

// Placeholder (index 0) is the default/reset value — `handleSearch` skips it
// so a blank selection lands on the plain listing page. City list is shared
// with the listing forms via CITIES so the two never drift apart.
// Derived from the canonical species list so the quick-search values map
// cleanly to DB slugs (no more "მღრღნელი"/"თევზი" that match nothing).
const SPECIES = ["ყველა სახეობა", ...SPECIES_OPTIONS.map((s) => s.ka)];
const LOCATIONS = ["ყველა ქალაქი", ...CITIES];
const DEAL_TYPES = ["ყველა", "ყიდვა-გაყიდვა", "გაჩუქება", "შეჯვარება"];

// Slug map so the quick-search button routes to the right section
const DEAL_HREF: Record<string, string> = {
  "ყველა": "/buy-sell",
  "ყიდვა-გაყიდვა": "/buy-sell",
  "გაჩუქება": "/adoption",
  "შეჯვარება": "/mating",
};

type QuickChipKey = "all" | "adoption" | "lost" | "vetClinics";
const QUICK_CHIPS: { icon: LucideIcon; labelKey: QuickChipKey; href: string }[] = [
  { icon: TrendingUp, labelKey: "all", href: "/buy-sell" },
  { icon: Gift, labelKey: "adoption", href: "/adoption" },
  { icon: AlertCircle, labelKey: "lost", href: "/lost-found" },
  { icon: Stethoscope, labelKey: "vetClinics", href: "/services/vet-clinics" },
];

// `deal` drives the badge logic: "adoption" listings show a soft green badge
// instead of a price.
// Shape the cards render. Real listings are mapped into this via `toCard`.
type CardItem = {
  id: string;
  breed: string;
  price: string;
  location: string;
  ageMonths: number;
  bg: string;
  img: string;
  deal: string;
};

// Gradient backdrops cycled by index so a run of cards stays colourful.
const CARD_BG = [
  "from-amber-50 to-amber-100",
  "from-sky-50 to-sky-100",
  "from-emerald-50 to-emerald-100",
  "from-violet-50 to-violet-100",
  "from-stone-50 to-stone-100",
  "from-pink-50 to-pink-100",
  "from-yellow-50 to-yellow-100",
  "from-teal-50 to-teal-100",
];

// Adoption listings show a "ჩუქდება" badge instead of a price, so their price
// string is unused; sale/mating format by currency.
function priceLabel(l: Listing): string {
  if (l.type === "adoption") return "₾ 0";
  const sym = "currency" in l && l.currency === "USD" ? "$" : "₾";
  const p = "price" in l && typeof l.price === "number" ? l.price : 0;
  return `${sym} ${p.toLocaleString("en-US")}`;
}

function toCard(l: Listing, i: number): CardItem {
  return {
    id: l._id,
    breed: l.breed,
    price: priceLabel(l),
    // `location` is stored as "<city>, <district>" — show the city only.
    location: (l.location ?? "").split(",")[0].trim() || l.location,
    ageMonths: l.age,
    bg: CARD_BG[i % CARD_BG.length],
    img: l.images?.[0] ?? "",
    deal: l.type === "adoption" ? "adoption" : "sale",
  };
}

// `key` maps to the live-count keys returned by /api/marketplace/stats
// (listing `type` or business `category`). Icons are lucide outline glyphs,
// unified under the brand green so the grid reads as one system.
type CategoryKey =
  | "buySell"
  | "adoption"
  | "mating"
  | "lostFound"
  | "vetClinics"
  | "petHotels"
  | "petShops"
  | "petFriendly";
const CATEGORIES: { Icon: LucideIcon; labelKey: CategoryKey; key: string; href: string }[] = [
  { Icon: ShoppingBag, labelKey: "buySell", key: "buy-sell", href: "/buy-sell" },
  { Icon: Gift, labelKey: "adoption", key: "adoption", href: "/adoption" },
  { Icon: HeartHandshake, labelKey: "mating", key: "mating", href: "/mating" },
  { Icon: Search, labelKey: "lostFound", key: "lost-found", href: "/lost-found" },
  { Icon: Stethoscope, labelKey: "vetClinics", key: "vet-clinics", href: "/services/vet-clinics" },
  { Icon: Hotel, labelKey: "petHotels", key: "pet-hotels", href: "/services/pet-hotels" },
  { Icon: Store, labelKey: "petShops", key: "pet-shops", href: "/services/pet-shops" },
  { Icon: PawPrint, labelKey: "petFriendly", key: "pet-friendly", href: "/services/pet-friendly" },
];

// Formats a live category total for display. `null` (still loading) → "…";
// a real count renders as e.g. "2,400". Zero shows as "0".
function formatCount(count: number | null | undefined): string {
  if (count == null) return "…";
  return count.toLocaleString("en-US");
}

/** Minimal inline select styled to match the search bar — no extra chrome. */
function QuickSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="relative flex-1 min-w-0 px-5 py-2.5 border-r border-stone-200 cursor-pointer hover:bg-stone-50 transition-colors block">
      <span className="block text-[10px] text-stone-400 font-semibold uppercase tracking-wider leading-none mb-1">
        {label}
      </span>
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-[#0F2830] leading-none truncate">{value}</span>
        <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function HomePage() {
  const { t } = useT();
  const router = useRouter();
  const [species, setSpecies] = useState(SPECIES[0]);
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [deal, setDeal] = useState(DEAL_TYPES[0]);

  // Live listings from the DB. "VIP" = paid-promoted listings with an active
  // VIP period only; "new" = the newest listings regardless of VIP status.
  const [vipListings, setVipListings] = useState<CardItem[]>([]);
  const [newListings, setNewListings] = useState<CardItem[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);

  // Live per-category totals; null until the stats fetch resolves.
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const types = ["buy-sell", "adoption", "mating"];
        const results = await Promise.all(
          types.map((t) =>
            fetch(`/api/marketplace/${t}`)
              .then((r) => (r.ok ? r.json() : { listings: [] }))
              .catch(() => ({ listings: [] }))
          )
        );
        const all: Listing[] = results.flatMap((r) => r.listings ?? []);
        // Newest first across all fetched types.
        all.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
        if (!active) return;

        // VIP row = paid-promoted listings ONLY, with an unexpired VIP period.
        // No padding with plain listings — an unpaid listing must never wear the
        // VIP badge. Empty when nothing is VIP. "New" row = all recent listings
        // regardless of VIP status, newest first (already sorted above).
        const vip = all.filter(isVipActive).slice(0, 4);
        const rest = all.slice(0, 8);

        setVipListings(vip.map(toCard));
        setNewListings(rest.map(toCard));
      } catch {
        // Leave lists empty; the empty state renders below.
      } finally {
        if (active) setListingsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/marketplace/stats")
      .then((r) => (r.ok ? r.json() : { counts: {} }))
      .then((d) => {
        if (active) setCounts(d.counts ?? {});
      })
      .catch(() => {
        if (active) setCounts({});
      });
    return () => {
      active = false;
    };
  }, []);

  // Route to the right results page, carrying the chosen filters as query
  // params (e.g. /buy-sell?species=ძაღლი&city=თბილისი). Defaults are skipped
  // so a blank search lands on the plain listing page.
  const handleSearch = () => {
    const params = new URLSearchParams();
    // Keep everything Georgian in the URL; the API maps species → DB slug.
    if (species !== SPECIES[0]) params.set("species", species);
    if (location !== LOCATIONS[0]) params.set("city", location);
    const query = params.toString();
    const base = DEAL_HREF[deal] ?? "/buy-sell";
    router.push(query ? `${base}?${query}` : base);
  };

  return (
    <div className="min-h-screen bg-white overflow-x-clip">
      {/* ─── Search Hero ─── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#E3F2F8] via-[#EBF6FA] to-white pt-20 pb-14 px-4">
        {/* Ambient drifting blobs for depth */}
        <div className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-[#0E4A5C]/10 blur-3xl animate-blob" />
        <div className="pointer-events-none absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl animate-blob [animation-delay:-6s]" />
        {/* Floating paw motifs */}
        <PawPrint className="pointer-events-none absolute top-8 right-[12%] h-8 w-8 text-[#0E4A5C]/10 animate-float" />
        <PawPrint className="pointer-events-none absolute bottom-10 left-[8%] h-10 w-10 text-[#0E4A5C]/10 animate-float-slow" />

        <div className="relative max-w-5xl mx-auto">
          {/* Hero title */}
          <Reveal direction="up">
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-4xl font-black text-[#0F2830] leading-tight">
                {t.home.hero.title}
              </h1>
              <p className="text-stone-500 text-sm sm:text-base mt-2">
                {t.home.hero.subtitle}
              </p>
            </div>
          </Reveal>

          {/* Quick search bar */}
          <Reveal direction="up" delay={80}>
            <div className="flex flex-col md:flex-row items-stretch bg-white rounded-2xl border-2 border-[#0E4A5C] shadow-[0_18px_45px_-18px_rgba(14,74,92,0.55)] overflow-hidden transition-shadow hover:shadow-[0_24px_60px_-18px_rgba(14,74,92,0.65)] md:pr-2">
              <div className="flex items-stretch divide-y md:divide-y-0 flex-1 flex-col md:flex-row">
                <QuickSelect label={t.home.search.speciesLabel} value={species} options={SPECIES} onChange={setSpecies} />
                <QuickSelect label={t.home.search.locationLabel} value={location} options={LOCATIONS} onChange={setLocation} />
                <QuickSelect label={t.home.search.dealLabel} value={deal} options={DEAL_TYPES} onChange={setDeal} />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                className="group bg-[#0E4A5C] hover:bg-[#0B3D4E] text-white px-7 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap md:my-1.5 md:rounded-xl"
              >
                <Search className="w-4 h-4 transition-transform group-hover:scale-110" />
                {t.home.search.button}
              </button>
            </div>
          </Reveal>

          {/* AI natural-language search */}
          <Reveal direction="up" delay={110}>
            <div className="mt-3">
              <SmartSearch />
            </div>
          </Reveal>

          {/* Quick chips */}
          <Reveal direction="up" delay={140}>
            <div className="flex items-center justify-center gap-2.5 mt-5 flex-wrap">
              {QUICK_CHIPS.map((chip) => (
                <Link
                  key={chip.labelKey}
                  href={chip.href}
                  className="flex items-center gap-2 bg-white/90 backdrop-blur rounded-xl px-4 py-2.5 text-[13px] font-medium text-stone-600 hover:text-[#0E4A5C] hover:-translate-y-0.5 hover:shadow-md transition-all border border-stone-200 shadow-sm"
                >
                  <chip.icon className="w-4 h-4 text-[#0E4A5C]" />
                  {t.home.quickChips[chip.labelKey]}
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── SOS / Lost pets strip ─── */}
      <section className="max-w-7xl mx-auto px-4 -mt-6 relative z-10">
        <Reveal direction="up">
          <Link
            href="/listings/new?category=lost-found"
            className="group flex items-center gap-4 rounded-2xl border border-rose-100 border-l-4 border-l-rose-400 bg-gradient-to-r from-rose-50 via-rose-50/60 to-orange-50/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all px-5 py-4"
          >
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-rose-500 ring-1 ring-rose-100 shadow-sm">
              <span className="absolute inline-flex h-full w-full rounded-xl bg-rose-400/30 animate-ping" />
              <AlertCircle className="relative w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="flex items-center gap-2 font-black text-[#0F2830] text-sm sm:text-base">
                <span className="text-rose-500 tracking-wide">SOS</span>
                {t.home.sos.title}
              </p>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5 truncate">
                {t.home.sos.subtitle}
              </p>
            </div>
            <span className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-rose-500 shrink-0 group-hover:gap-2.5 transition-all">
              {t.home.sos.action}
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </Reveal>
      </section>

      {/* ─── VIP Listings ─── */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <Reveal direction="left">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-orange-500" />
              <h2 className="font-black text-xl text-[#0F2830]">{t.home.vipHeading}</h2>
            </div>
            <Link href="/buy-sell" className="text-sm text-stone-500 hover:text-[#0E4A5C] font-medium transition-colors">
              {t.home.seeAll}
            </Link>
          </div>
        </Reveal>

        {listingsLoading ? (
          <SkeletonGrid />
        ) : vipListings.length ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {vipListings.map((item, i) => (
              <Reveal key={item.id} direction="up" delay={i * 90}>
                <ListingCard item={item} vip />
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyListings />
        )}
      </section>

      {/* ─── Browse by Category ─── */}
      <section className="bg-[#EBF6FA] py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <Reveal direction="left">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-black text-xl text-[#0F2830]">{t.home.categoriesHeading}</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {CATEGORIES.map((cat, i) => (
              <Reveal key={cat.key} direction="scale" delay={i * 60}>
                <Link
                  href={cat.href}
                  className="group flex flex-col items-center gap-2.5 bg-white rounded-2xl p-4 border border-stone-100 hover:border-[#0E4A5C]/30 hover:-translate-y-1 hover:shadow-md transition-all h-full"
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 text-[#0E4A5C] ring-1 ring-emerald-100 transition-all group-hover:bg-[#0E4A5C] group-hover:text-white group-hover:scale-105">
                    <cat.Icon className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-semibold text-[#0F2830] leading-snug">{t.home.categories[cat.labelKey]}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">{formatCount(counts ? counts[cat.key] ?? 0 : null)}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Latest Listings ─── */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <Reveal direction="left">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-[#0E4A5C]" />
              <h2 className="font-black text-xl text-[#0F2830]">{t.home.latestHeading}</h2>
            </div>
            <Link href="/buy-sell?sort=newest" className="text-sm text-stone-500 hover:text-[#0E4A5C] font-medium transition-colors">
              {t.home.seeAll}
            </Link>
          </div>
        </Reveal>

        {listingsLoading ? (
          <SkeletonGrid />
        ) : newListings.length ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {newListings.map((item, i) => (
              <Reveal key={item.id} direction="up" delay={i * 90}>
                <ListingCard item={item} />
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyListings />
        )}
      </section>

      {/* ─── CTA banner ─── */}
      <section className="px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <Reveal direction="up">
            <div className="relative overflow-hidden rounded-3xl bg-[#093040] px-6 py-10 sm:px-12 sm:py-12 text-center">
              {/* Soft radial glow + paw motif for depth (same palette) */}
              <div className="pointer-events-none absolute top-1/2 left-1/2 h-72 w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0E4A5C]/50 blur-3xl" />
              <PawPrint className="pointer-events-none absolute -bottom-4 -right-2 h-28 w-28 text-white/5" />
              <div className="relative max-w-2xl mx-auto">
                <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                  {t.home.cta.title}
                </h2>
                <p className="text-white/60 text-sm sm:text-base mt-3">
                  {t.home.cta.subtitle}
                </p>
                <Link
                  href="/listings/new"
                  className="group mt-7 inline-flex items-center gap-2 bg-white text-[#093040] px-7 py-3.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                  {t.home.cta.button}
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

/** Placeholder grid shown while the live feed loads. */
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="rounded-2xl aspect-[4/3] bg-stone-100 ring-1 ring-black/5" />
          <div className="pt-3 space-y-2">
            <div className="h-5 w-20 bg-stone-100 rounded" />
            <div className="h-3 w-28 bg-stone-100 rounded" />
            <div className="h-3 w-24 bg-stone-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Empty state when no listings exist yet — invites the first post. */
function EmptyListings() {
  const { t } = useT();
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 gap-3">
      <div className="text-4xl">🐾</div>
      <p className="text-sm text-stone-500">{t.home.empty.text}</p>
      <Link
        href="/listings/new"
        className="inline-flex items-center gap-2 bg-[#0E4A5C] hover:bg-[#0B3D4E] text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
      >
        <Plus className="w-4 h-4" />
        {t.home.empty.action}
      </Link>
    </div>
  );
}

/** Shared listing card with hover micro-interactions + adoption/VIP badge logic. */
function ListingCard({
  item,
  vip = false,
}: {
  item: CardItem;
  vip?: boolean;
}) {
  const { t } = useT();
  const isAdoption = item.deal === "adoption";
  const ageText =
    item.ageMonths < 12
      ? `${item.ageMonths} ${t.home.card.ageMonths}`
      : `${Math.floor(item.ageMonths / 12)} ${t.home.card.ageYears}`;
  return (
    <Link href={`/listings/${item.id}`} className="group block">
      <div
        className={`relative rounded-2xl overflow-hidden aspect-[4/3] bg-gradient-to-br ${item.bg} shadow-sm group-hover:-translate-y-1 group-hover:shadow-xl transition-all duration-300 ${
          vip ? "ring-2 ring-amber-300/70" : "ring-1 ring-black/5"
        }`}
      >
        {/* Sweeping sheen on hover */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-out" />
        {item.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.img}
            alt={item.breed}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          // No photo → keep the gradient backdrop with a paw glyph.
          <div className="flex h-full w-full items-center justify-center text-5xl opacity-60">
            🐾
          </div>
        )}

        {/* VIP star accent — subtle, corner only */}
        {vip && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-white/85 backdrop-blur text-amber-600 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            VIP
          </div>
        )}

        {/* Favorite */}
        <FavoriteButton
          listingId={item.id}
          className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow"
        />
      </div>
      <div className="pt-3 pb-1">
        {isAdoption ? (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-sm font-bold px-3 py-1 rounded-full">
            <Gift className="w-3.5 h-3.5" />
            {t.home.card.adoptionBadge}
          </span>
        ) : (
          <p className="font-black text-[#0F2830] text-lg leading-tight">{item.price}</p>
        )}
        <p className="text-sm text-stone-600 font-medium mt-1.5">{item.breed}</p>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-stone-400">
          <span className="inline-flex items-center gap-1 min-w-0">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-[#0E4A5C]/60" strokeWidth={1.75} />
            <span className="truncate">{item.location}</span>
          </span>
          <span className="inline-flex items-center gap-1 shrink-0">
            <Cake className="w-3.5 h-3.5 text-[#0E4A5C]/60" strokeWidth={1.75} />
            {ageText}
          </span>
        </div>
      </div>
    </Link>
  );
}
