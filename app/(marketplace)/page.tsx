"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  Heart,
  MapPin,
  Rocket,
  TrendingUp,
  PawPrint,
  Stethoscope,
  Hotel,
  ShoppingBag,
  Gift,
  AlertCircle,
  Shuffle,
} from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { CountUp } from "@/components/ui/CountUp";

const ANIMAL_TYPES = [
  "ყველა ტიპი",
  "ძაღლი",
  "კატა",
  "ჩიტი",
  "კურდღელი",
  "სხვა",
];

const QUICK_CHIPS = [
  { icon: TrendingUp, label: "ფასების სტატისტიკა", href: "/buy-sell" },
  { icon: PawPrint, label: "ძაღლები", href: "/buy-sell?species=dog" },
  { icon: PawPrint, label: "კატები", href: "/buy-sell?species=cat" },
  { icon: Gift, label: "გაჩუქება", href: "/adoption" },
  { icon: AlertCircle, label: "დაკარგული", href: "/lost-found" },
  { icon: Stethoscope, label: "ვეტ-კლინიკები", href: "/services/vet-clinics" },
];

const VIP_LISTINGS = [
  {
    breed: "German Shepherd",
    price: "₾ 1,500",
    location: "თბილისი",
    age: "3 თვე",
    bg: "from-amber-50 to-amber-100",
    emoji: "🐕",
  },
  {
    breed: "British Shorthair",
    price: "₾ 800",
    location: "ბათუმი",
    age: "2 თვე",
    bg: "from-sky-50 to-sky-100",
    emoji: "🐈",
  },
  {
    breed: "Golden Retriever",
    price: "₾ 2,000",
    location: "თბილისი",
    age: "6 კვირა",
    bg: "from-emerald-50 to-emerald-100",
    emoji: "🐕‍🦺",
  },
  {
    breed: "Maine Coon",
    price: "₾ 1,200",
    location: "ქუთაისი",
    age: "3 თვე",
    bg: "from-violet-50 to-violet-100",
    emoji: "🐱",
  },
];

const STANDARD_LISTINGS = [
  {
    breed: "Husky",
    price: "₾ 900",
    location: "თბილისი",
    age: "4 თვე",
    bg: "from-stone-50 to-stone-100",
    emoji: "🐺",
  },
  {
    breed: "Persian Cat",
    price: "₾ 600",
    location: "რუსთავი",
    age: "5 კვირა",
    bg: "from-pink-50 to-pink-100",
    emoji: "🐈‍⬛",
  },
  {
    breed: "Labrador",
    price: "₾ 1,100",
    location: "ბათუმი",
    age: "8 კვირა",
    bg: "from-yellow-50 to-yellow-100",
    emoji: "🦮",
  },
  {
    breed: "Scottish Fold",
    price: "₾ 750",
    location: "გორი",
    age: "3 თვე",
    bg: "from-teal-50 to-teal-100",
    emoji: "😸",
  },
];

const CATEGORIES = [
  { icon: ShoppingBag, label: "ყიდვა-გაყიდვა", count: "2,400+", href: "/buy-sell", color: "bg-amber-50 text-amber-600" },
  { icon: Gift, label: "გაჩუქება", count: "380+", href: "/adoption", color: "bg-emerald-50 text-emerald-600" },
  { icon: Shuffle, label: "შეჯვარება", count: "150+", href: "/mating", color: "bg-sky-50 text-sky-600" },
  { icon: AlertCircle, label: "დაკარგული/ნაპოვნი", count: "60+", href: "/lost-found", color: "bg-rose-50 text-rose-600" },
  { icon: Stethoscope, label: "ვეტ-კლინიკები", count: "120+", href: "/services/vet-clinics", color: "bg-violet-50 text-violet-600" },
  { icon: Hotel, label: "სასტუმროები", count: "80+", href: "/services/pet-hotels", color: "bg-indigo-50 text-indigo-600" },
  { icon: ShoppingBag, label: "პეთ-მაღაზიები", count: "200+", href: "/services/pet-shops", color: "bg-orange-50 text-orange-600" },
  { icon: MapPin, label: "Pet-Friendly", count: "350+", href: "/services/pet-friendly", color: "bg-lime-50 text-lime-600" },
];

const STATS = [
  { value: 10000, suffix: "+", label: "ცხოველის განცხადება" },
  { value: 500, suffix: "+", label: "ვერიფიცირებული სერვისი" },
  { value: 50000, suffix: "+", label: "აქტიური მომხმარებელი" },
];

export default function HomePage() {
  const [animalType, setAnimalType] = useState("ყველა ტიპი");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white overflow-x-clip">
      {/* ─── Search Hero ─── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#E3F2F8] via-[#EBF6FA] to-white py-12 px-4">
        {/* Ambient drifting blobs for depth */}
        <div className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-[#0E4A5C]/10 blur-3xl animate-blob" />
        <div className="pointer-events-none absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl animate-blob [animation-delay:-6s]" />
        {/* Floating paw motifs */}
        <PawPrint className="pointer-events-none absolute top-8 right-[12%] h-8 w-8 text-[#0E4A5C]/10 animate-float" />
        <PawPrint className="pointer-events-none absolute bottom-10 left-[8%] h-10 w-10 text-[#0E4A5C]/10 animate-float-slow" />
        <PawPrint className="pointer-events-none absolute top-1/2 left-[45%] h-6 w-6 text-[#0E4A5C]/10 animate-float [animation-delay:-3s]" />

        <div className="relative max-w-5xl mx-auto">
          {/* Search bar */}
          <Reveal direction="up">
            <div className="flex items-stretch bg-white rounded-2xl border-2 border-[#0E4A5C] shadow-[0_18px_45px_-18px_rgba(14,74,92,0.55)] overflow-visible relative transition-shadow hover:shadow-[0_24px_60px_-18px_rgba(14,74,92,0.65)]">
              {/* Animal type dropdown */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 px-5 h-full min-w-[170px] border-r border-stone-200 hover:bg-stone-50 transition-colors text-left"
                >
                  <div className="flex-1">
                    <div className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider leading-none mb-1">
                      ტიპი
                    </div>
                    <div className="text-sm font-semibold text-[#0F2830] leading-none">
                      {animalType}
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute top-[calc(100%+4px)] left-0 bg-white border border-stone-200 rounded-xl shadow-xl min-w-[170px] z-50 overflow-hidden py-1">
                    {ANIMAL_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setAnimalType(type);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          animalType === type
                            ? "bg-[#EBF6FA] text-[#0E4A5C] font-semibold"
                            : "text-stone-700 hover:bg-stone-50"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Breed / location */}
              <input
                type="text"
                placeholder="ჯიში, ასაკი, მდებარეობა..."
                className="flex-1 px-5 py-4 text-sm outline-none text-stone-700 placeholder:text-stone-400 min-w-0 rounded-l-[2px] focus:bg-[#F6FBFD] transition-colors"
              />

              {/* Divider */}
              <div className="w-px bg-stone-200 self-stretch my-3 hidden md:block" />

              {/* ID / phone */}
              <input
                type="text"
                placeholder="ID, ტელეფონი"
                className="w-44 px-4 py-4 text-sm outline-none text-stone-700 placeholder:text-stone-400 hidden md:block focus:bg-[#F6FBFD] transition-colors"
              />

              {/* Filters icon */}
              <button className="px-4 border-l border-stone-200 text-stone-400 hover:text-[#0E4A5C] transition-colors hidden sm:flex items-center">
                <SlidersHorizontal className="w-5 h-5" />
              </button>

              {/* Search button */}
              <button className="group bg-[#0E4A5C] hover:bg-[#0B3D4E] text-white px-7 py-4 font-bold text-sm flex items-center gap-2 transition-colors whitespace-nowrap rounded-r-[14px]">
                <Search className="w-4 h-4 transition-transform group-hover:scale-110" />
                ძება
              </button>
            </div>
          </Reveal>

          {/* Quick chips */}
          <Reveal direction="up" delay={120}>
            <div className="flex items-center gap-2.5 mt-5 flex-wrap">
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

      {/* ─── VIP Listings ─── */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <Reveal direction="left">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-orange-500" />
              <h2 className="font-black text-xl text-[#0F2830]">VIP განცხადებები</h2>
            </div>
            <Link
              href="/buy-sell"
              className="text-sm text-stone-500 hover:text-[#0E4A5C] font-medium transition-colors"
            >
              ყველას ნახვა →
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {VIP_LISTINGS.map((item, i) => (
            <Reveal key={i} direction="up" delay={i * 90}>
              <Link href="/buy-sell" className="group block">
                <div
                  className={`relative rounded-2xl overflow-hidden aspect-[4/3] bg-gradient-to-br ${item.bg} ring-1 ring-black/5 shadow-sm group-hover:-translate-y-1 group-hover:shadow-xl transition-all duration-300`}
                >
                  {/* Sweeping sheen on hover */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-out" />
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
                      {item.emoji}
                    </span>
                  </div>
                  {/* VIP badge */}
                  <div className="absolute top-2.5 left-2.5 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 animate-shimmer text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                    <Rocket className="w-2.5 h-2.5" />
                    VIP
                  </div>
                  {/* Heart */}
                  <button
                    onClick={(e) => e.preventDefault()}
                    className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow"
                  >
                    <Heart className="w-3.5 h-3.5 text-stone-400 hover:text-rose-500 transition-colors" />
                  </button>
                </div>
                <div className="pt-3 pb-1">
                  <p className="font-black text-[#0F2830] text-lg leading-tight">
                    {item.price}
                  </p>
                  <p className="text-sm text-stone-600 font-medium mt-0.5">{item.breed}</p>
                  <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {item.location} · {item.age}
                  </p>
                </div>
              </Link>
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
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${cat.color} transition-transform group-hover:scale-110 group-hover:-rotate-6`}>
                    <cat.icon className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-semibold text-[#0F2830] leading-snug">
                      {cat.label}
                    </p>
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
            <Link
              href="/buy-sell"
              className="text-sm text-stone-500 hover:text-[#0E4A5C] font-medium transition-colors"
            >
              ყველას ნახვა →
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STANDARD_LISTINGS.map((item, i) => (
            <Reveal key={i} direction="up" delay={i * 90}>
              <Link href="/buy-sell" className="group block">
                <div
                  className={`relative rounded-2xl overflow-hidden aspect-[4/3] bg-gradient-to-br ${item.bg} ring-1 ring-black/5 shadow-sm group-hover:-translate-y-1 group-hover:shadow-xl transition-all duration-300`}
                >
                  {/* Sweeping sheen on hover */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-out" />
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
                      {item.emoji}
                    </span>
                  </div>
                  <button
                    onClick={(e) => e.preventDefault()}
                    className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow"
                  >
                    <Heart className="w-3.5 h-3.5 text-stone-400 hover:text-rose-500 transition-colors" />
                  </button>
                </div>
                <div className="pt-3 pb-1">
                  <p className="font-black text-[#0F2830] text-lg leading-tight">{item.price}</p>
                  <p className="text-sm text-stone-600 font-medium mt-0.5">{item.breed}</p>
                  <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {item.location} · {item.age}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── Stats bar ─── */}
      <section className="relative overflow-hidden bg-[#093040] py-12 px-4">
        {/* Soft radial glow for depth */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-72 w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0E4A5C]/40 blur-3xl" />
        <div className="relative max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center text-white">
          {STATS.map((s, i) => (
            <Reveal key={s.label} direction="up" delay={i * 120}>
              <div>
                <p className="text-4xl font-black mb-1 tabular-nums">
                  <CountUp end={s.value} suffix={s.suffix} />
                </p>
                <p className="text-white/60 text-sm">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
