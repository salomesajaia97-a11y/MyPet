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

export default function HomePage() {
  const [animalType, setAnimalType] = useState("ყველა ტიპი");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Search Hero ─── */}
      <section className="bg-[#FAF7F2] py-10 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Search bar */}
          <div className="flex items-stretch bg-white rounded-2xl border-2 border-[#6B5240] shadow-sm overflow-visible relative">
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
                  <div className="text-sm font-semibold text-[#1C1917] leading-none">
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
                          ? "bg-[#F5F0E8] text-[#6B5240] font-semibold"
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
              className="flex-1 px-5 py-4 text-sm outline-none text-stone-700 placeholder:text-stone-400 min-w-0"
            />

            {/* Divider */}
            <div className="w-px bg-stone-200 self-stretch my-3 hidden md:block" />

            {/* ID / phone */}
            <input
              type="text"
              placeholder="ID, ტელეფონი"
              className="w-44 px-4 py-4 text-sm outline-none text-stone-700 placeholder:text-stone-400 hidden md:block"
            />

            {/* Filters icon */}
            <button className="px-4 border-l border-stone-200 text-stone-400 hover:text-[#6B5240] transition-colors hidden sm:flex items-center">
              <SlidersHorizontal className="w-5 h-5" />
            </button>

            {/* Search button */}
            <button className="bg-[#6B5240] hover:bg-[#5a4435] text-white px-7 py-4 font-bold text-sm flex items-center gap-2 transition-colors whitespace-nowrap rounded-r-[14px]">
              <Search className="w-4 h-4" />
              ძება
            </button>
          </div>

          {/* Quick chips */}
          <div className="flex items-center gap-2.5 mt-5 flex-wrap">
            {QUICK_CHIPS.map((chip) => (
              <Link
                key={chip.label}
                href={chip.href}
                className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 text-[13px] font-medium text-stone-600 hover:text-[#6B5240] hover:shadow-md transition-all border border-stone-200 shadow-sm"
              >
                <chip.icon className="w-4 h-4 text-[#6B5240]" />
                {chip.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VIP Listings ─── */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-orange-500" />
            <h2 className="font-black text-xl text-[#1C1917]">VIP განცხადებები</h2>
          </div>
          <Link
            href="/buy-sell"
            className="text-sm text-stone-500 hover:text-[#6B5240] font-medium transition-colors"
          >
            ყველას ნახვა →
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {VIP_LISTINGS.map((item, i) => (
            <Link key={i} href="/buy-sell" className="group block">
              <div
                className={`relative rounded-2xl overflow-hidden aspect-[4/3] bg-gradient-to-br ${item.bg}`}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
                    {item.emoji}
                  </span>
                </div>
                {/* VIP badge */}
                <div className="absolute top-2.5 left-2.5 bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                  <Rocket className="w-2.5 h-2.5" />
                  VIP
                </div>
                {/* Heart */}
                <button
                  onClick={(e) => e.preventDefault()}
                  className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors shadow"
                >
                  <Heart className="w-3.5 h-3.5 text-stone-400 hover:text-rose-500 transition-colors" />
                </button>
              </div>
              <div className="pt-3 pb-1">
                <p className="font-black text-[#1C1917] text-lg leading-tight">
                  {item.price}
                </p>
                <p className="text-sm text-stone-600 font-medium mt-0.5">{item.breed}</p>
                <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {item.location} · {item.age}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Browse by Category ─── */}
      <section className="bg-[#FAF7F2] py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-black text-xl text-[#1C1917]">კატეგორიები</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className="group flex flex-col items-center gap-2.5 bg-white rounded-2xl p-4 border border-stone-100 hover:border-[#6B5240]/30 hover:shadow-md transition-all"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${cat.color}`}>
                  <cat.icon className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-semibold text-[#1C1917] leading-snug">
                    {cat.label}
                  </p>
                  <p className="text-[10px] text-stone-400 mt-0.5">{cat.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Latest Listings ─── */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <PawPrint className="w-5 h-5 text-[#6B5240]" />
            <h2 className="font-black text-xl text-[#1C1917]">ახალი განცხადებები</h2>
          </div>
          <Link
            href="/buy-sell"
            className="text-sm text-stone-500 hover:text-[#6B5240] font-medium transition-colors"
          >
            ყველას ნახვა →
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STANDARD_LISTINGS.map((item, i) => (
            <Link key={i} href="/buy-sell" className="group block">
              <div
                className={`relative rounded-2xl overflow-hidden aspect-[4/3] bg-gradient-to-br ${item.bg}`}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
                    {item.emoji}
                  </span>
                </div>
                <button
                  onClick={(e) => e.preventDefault()}
                  className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors shadow"
                >
                  <Heart className="w-3.5 h-3.5 text-stone-400 hover:text-rose-500 transition-colors" />
                </button>
              </div>
              <div className="pt-3 pb-1">
                <p className="font-black text-[#1C1917] text-lg leading-tight">{item.price}</p>
                <p className="text-sm text-stone-600 font-medium mt-0.5">{item.breed}</p>
                <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {item.location} · {item.age}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Stats bar ─── */}
      <section className="bg-[#4A3728] py-10 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center text-white">
          {[
            { number: "10,000+", label: "ცხოველის განცხადება" },
            { number: "500+", label: "ვერიფიცირებული სერვისი" },
            { number: "50,000+", label: "აქტიური მომხმარებელი" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-black mb-1">{s.number}</p>
              <p className="text-white/60 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
