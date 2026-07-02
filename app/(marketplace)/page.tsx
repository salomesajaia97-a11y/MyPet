"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Search,
  ChevronDown,
  Heart,
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
} from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

const SPECIES = ["ყველა ტიპი", "ძაღლი", "კატა", "ჩიტი", "კურდღელი", "სხვა"];
const LOCATIONS = ["ყველა ქალაქი", "თბილისი", "ბათუმი", "ქუთაისი", "რუსთავი", "გორი"];
const DEAL_TYPES = ["ყველა", "ყიდვა-გაყიდვა", "გაჩუქება", "შეჯვარება"];

// Slug map so the quick-search button routes to the right section
const DEAL_HREF: Record<string, string> = {
  "ყველა": "/buy-sell",
  "ყიდვა-გაყიდვა": "/buy-sell",
  "გაჩუქება": "/adoption",
  "შეჯვარება": "/mating",
};

const QUICK_CHIPS = [
  { icon: TrendingUp, label: "ფასების სტატისტიკა", href: "/buy-sell" },
  { icon: Gift, label: "გაჩუქება", href: "/adoption" },
  { icon: AlertCircle, label: "დაკარგული", href: "/lost-found" },
  { icon: Stethoscope, label: "ვეტ-კლინიკები", href: "/services/vet-clinics" },
];

// `deal` drives the badge logic: "adoption" listings show a soft green badge
// instead of a price.
// Unsplash placeholder photos (free-to-use) so cards look like a live site
// until real user-uploaded images exist. `bg` stays as the load-in backdrop.
const IMG = "?auto=format&fit=crop&w=800&q=80";

const VIP_LISTINGS = [
  { breed: "German Shepherd", price: "₾ 1,500", location: "თბილისი", age: "3 თვე", bg: "from-amber-50 to-amber-100", img: `https://images.unsplash.com/photo-1568572933382-74d440642117${IMG}`, deal: "sale" },
  { breed: "British Shorthair", price: "₾ 800", location: "ბათუმი", age: "2 თვე", bg: "from-sky-50 to-sky-100", img: `https://images.unsplash.com/photo-1574158622682-e40e69881006${IMG}`, deal: "sale" },
  { breed: "Golden Retriever", price: "₾ 2,000", location: "თბილისი", age: "6 კვირა", bg: "from-emerald-50 to-emerald-100", img: `https://images.unsplash.com/photo-1552053831-71594a27632d${IMG}`, deal: "sale" },
  { breed: "Beagle Mix", price: "₾ 0", location: "ქუთაისი", age: "3 თვე", bg: "from-violet-50 to-violet-100", img: `https://images.unsplash.com/photo-1505628346881-b72b27e84530${IMG}`, deal: "adoption" },
];

const STANDARD_LISTINGS = [
  { breed: "Husky", price: "₾ 900", location: "თბილისი", age: "4 თვე", bg: "from-stone-50 to-stone-100", img: `https://images.unsplash.com/photo-1605568427561-40dd23c2acea${IMG}`, deal: "sale" },
  { breed: "Persian Cat", price: "₾ 600", location: "რუსთავი", age: "5 კვირა", bg: "from-pink-50 to-pink-100", img: `https://images.unsplash.com/photo-1533738363-b7f9aef128ce${IMG}`, deal: "sale" },
  { breed: "Mixed Kitten", price: "₾ 0", location: "ბათუმი", age: "8 კვირა", bg: "from-yellow-50 to-yellow-100", img: `https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba${IMG}`, deal: "adoption" },
  { breed: "Scottish Fold", price: "₾ 750", location: "გორი", age: "3 თვე", bg: "from-teal-50 to-teal-100", img: `https://images.unsplash.com/photo-1573865526739-10659fec78a5${IMG}`, deal: "sale" },
];

const CATEGORIES = [
  { emoji: "🛍️", label: "ყიდვა-გაყიდვა", count: "2,400+", href: "/buy-sell", color: "bg-amber-50" },
  { emoji: "🎁", label: "გაჩუქება", count: "380+", href: "/adoption", color: "bg-emerald-50" },
  { emoji: "💞", label: "შეჯვარება", count: "150+", href: "/mating", color: "bg-sky-50" },
  { emoji: "🔎", label: "დაკარგული/ნაპოვნი", count: "60+", href: "/lost-found", color: "bg-rose-50" },
  { emoji: "🏥", label: "ვეტ-კლინიკები", count: "120+", href: "/services/vet-clinics", color: "bg-violet-50" },
  { emoji: "🏨", label: "სასტუმროები", count: "80+", href: "/services/pet-hotels", color: "bg-indigo-50" },
  { emoji: "🛒", label: "პეთ-მაღაზიები", count: "200+", href: "/services/pet-shops", color: "bg-orange-50" },
  { emoji: "🐾", label: "Pet-Friendly", count: "350+", href: "/services/pet-friendly", color: "bg-lime-50" },
];

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
  const router = useRouter();
  const [species, setSpecies] = useState(SPECIES[0]);
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [deal, setDeal] = useState(DEAL_TYPES[0]);

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
                იპოვე შენი ოთხფეხა მეგობარი
              </h1>
              <p className="text-stone-500 text-sm sm:text-base mt-2">
                ყიდვა, გაჩუქება და სერვისები — ერთ სივრცეში
              </p>
            </div>
          </Reveal>

          {/* Quick search bar */}
          <Reveal direction="up" delay={80}>
            <div className="flex flex-col md:flex-row items-stretch bg-white rounded-2xl border-2 border-[#0E4A5C] shadow-[0_18px_45px_-18px_rgba(14,74,92,0.55)] overflow-hidden transition-shadow hover:shadow-[0_24px_60px_-18px_rgba(14,74,92,0.65)] md:pr-2">
              <div className="flex items-stretch divide-y md:divide-y-0 flex-1 flex-col md:flex-row">
                <QuickSelect label="ტიპი" value={species} options={SPECIES} onChange={setSpecies} />
                <QuickSelect label="მდებარეობა" value={location} options={LOCATIONS} onChange={setLocation} />
                <QuickSelect label="განცხადება" value={deal} options={DEAL_TYPES} onChange={setDeal} />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                className="group bg-[#0E4A5C] hover:bg-[#0B3D4E] text-white px-7 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap md:my-1.5 md:rounded-xl"
              >
                <Search className="w-4 h-4 transition-transform group-hover:scale-110" />
                ძება
              </button>
            </div>
          </Reveal>

          {/* Quick chips */}
          <Reveal direction="up" delay={140}>
            <div className="flex items-center justify-center gap-2.5 mt-5 flex-wrap">
              {QUICK_CHIPS.map((chip) => (
                <Link
                  key={chip.label}
                  href={chip.href}
                  className="flex items-center gap-2 bg-white/90 backdrop-blur rounded-xl px-4 py-2.5 text-[13px] font-medium text-stone-600 hover:text-[#0E4A5C] hover:-translate-y-0.5 hover:shadow-md transition-all border border-stone-200 shadow-sm"
                >
                  <chip.icon className="w-4 h-4 text-[#0E4A5C]" />
                  {chip.label}
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
            href="/lost-found"
            className="group flex items-center gap-4 bg-white rounded-2xl border border-stone-200 border-l-4 border-l-rose-500 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all px-5 py-4"
          >
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
              <span className="absolute inline-flex h-full w-full rounded-xl bg-rose-400/30 animate-ping" />
              <AlertCircle className="relative w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="flex items-center gap-2 font-black text-[#0F2830] text-sm sm:text-base">
                <span className="text-rose-500 tracking-wide">SOS</span>
                დაკარგული ან ნაპოვნი ცხოველი?
              </p>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5 truncate">
                დაუყოვნებლივ გამოაქვეყნე — რაც უფრო სწრაფად, მით მეტი შანსი
              </p>
            </div>
            <span className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-rose-500 shrink-0 group-hover:gap-2.5 transition-all">
              სასწრაფო განცხადება
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
              <h2 className="font-black text-xl text-[#0F2830]">VIP განცხადებები</h2>
            </div>
            <Link href="/buy-sell" className="text-sm text-stone-500 hover:text-[#0E4A5C] font-medium transition-colors">
              ყველას ნახვა →
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {VIP_LISTINGS.map((item, i) => (
            <Reveal key={i} direction="up" delay={i * 90}>
              <ListingCard item={item} vip />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── Browse by Category ─── */}
      <section className="bg-[#EBF6FA] py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <Reveal direction="left">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-black text-xl text-[#0F2830]">კატეგორიები</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {CATEGORIES.map((cat, i) => (
              <Reveal key={cat.label} direction="scale" delay={i * 60}>
                <Link
                  href={cat.href}
                  className="group flex flex-col items-center gap-2.5 bg-white rounded-2xl p-4 border border-stone-100 hover:border-[#0E4A5C]/30 hover:-translate-y-1 hover:shadow-md transition-all h-full"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl leading-none ${cat.color} transition-transform group-hover:scale-110 group-hover:-rotate-6`}>
                    <span aria-hidden="true">{cat.emoji}</span>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-semibold text-[#0F2830] leading-snug">{cat.label}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">{cat.count}</p>
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
              <h2 className="font-black text-xl text-[#0F2830]">ახალი განცხადებები</h2>
            </div>
            <Link href="/buy-sell" className="text-sm text-stone-500 hover:text-[#0E4A5C] font-medium transition-colors">
              ყველას ნახვა →
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STANDARD_LISTINGS.map((item, i) => (
            <Reveal key={i} direction="up" delay={i * 90}>
              <ListingCard item={item} />
            </Reveal>
          ))}
        </div>
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
                  გყავს გასაყიდი ან გასაჩუქებელი ცხოველი?
                </h2>
                <p className="text-white/60 text-sm sm:text-base mt-3">
                  დაამატე განცხადება მარტივად და უფასოდ
                </p>
                <Link
                  href="/listings/new"
                  className="group mt-7 inline-flex items-center gap-2 bg-white text-[#093040] px-7 py-3.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                  განცხადების დამატება
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

/** Shared listing card with hover micro-interactions + adoption/VIP badge logic. */
function ListingCard({
  item,
  vip = false,
}: {
  item: (typeof VIP_LISTINGS)[number];
  vip?: boolean;
}) {
  const isAdoption = item.deal === "adoption";
  return (
    <Link href={isAdoption ? "/adoption" : "/buy-sell"} className="group block">
      <div
        className={`relative rounded-2xl overflow-hidden aspect-[4/3] bg-gradient-to-br ${item.bg} shadow-sm group-hover:-translate-y-1 group-hover:shadow-xl transition-all duration-300 ${
          vip ? "ring-2 ring-amber-300/70" : "ring-1 ring-black/5"
        }`}
      >
        {/* Sweeping sheen on hover */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-out" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.img}
          alt={item.breed}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* VIP star accent — subtle, corner only */}
        {vip && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-white/85 backdrop-blur text-amber-600 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            VIP
          </div>
        )}

        {/* Heart */}
        <button
          onClick={(e) => e.preventDefault()}
          className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow"
        >
          <Heart className="w-3.5 h-3.5 text-stone-400 hover:text-rose-500 transition-colors" />
        </button>
      </div>
      <div className="pt-3 pb-1">
        {isAdoption ? (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-sm font-bold px-3 py-1 rounded-full">
            <Gift className="w-3.5 h-3.5" />
            ჩუქდება
          </span>
        ) : (
          <p className="font-black text-[#0F2830] text-lg leading-tight">{item.price}</p>
        )}
        <p className="text-sm text-stone-600 font-medium mt-1.5">{item.breed}</p>
        <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
          <MapPin className="w-3 h-3 shrink-0" />
          {item.location} · {item.age}
        </p>
      </div>
    </Link>
  );
}
