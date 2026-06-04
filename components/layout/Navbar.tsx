"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { PawPrint, Plus, Heart, LogIn, LogOut, User, Phone, Globe, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useState, useRef, useEffect } from "react";

const SUB_NAV = [
  { href: "/buy-sell", label: "ყიდვა-გაყიდვა" },
  { href: "/adoption", label: "გაჩუქება" },
  { href: "/mating", label: "შეჯვარება" },
  { href: "/lost-found", label: "დაკარგული/ნაპოვნი" },
  { href: "/services/vet-clinics", label: "ვეტ-კლინიკები" },
  { href: "/services/pet-hotels", label: "სასტუმროები" },
  { href: "/services/pet-shops", label: "მაღაზიები" },
  { href: "/services/pet-friendly", label: "Pet-Friendly" },
];

const LANGUAGES = [
  { code: "ka", label: "ქართული" },
  { code: "en", label: "English" },
];

const CURRENCIES = [
  { code: "GEL", label: "GEL", symbol: "₾" },
  { code: "EUR", label: "EUR", symbol: "€" },
];

function LocaleSelector() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("ka");
  const [currency, setCurrency] = useState("GEL");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === lang)!;
  const currentCurrency = CURRENCIES.find((c) => c.code === currency)!;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="hidden sm:flex items-center gap-2 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 hover:border-stone-300 hover:bg-stone-50 transition-all font-medium"
      >
        <Globe className="w-4 h-4 text-stone-500" />
        <span>{currentLang.label}, {currentCurrency.symbol}</span>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] bg-white border border-stone-200 rounded-2xl shadow-xl w-56 z-50 overflow-hidden">
          {/* Language section */}
          <div className="px-4 pt-4 pb-2">
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2.5">
              ენა
            </p>
            <div className="space-y-1">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-stone-50 transition-colors text-left"
                >
                  {/* Radio circle */}
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                      lang === l.code
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-stone-300"
                    )}
                  >
                    {lang === l.code && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      lang === l.code ? "text-[#1C1917]" : "text-stone-600"
                    )}
                  >
                    {l.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-stone-100 mx-4" />

          {/* Currency section */}
          <div className="px-4 pt-3 pb-4">
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2.5">
              ვალუტა
            </p>
            <div className="space-y-1">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setCurrency(c.code)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-stone-50 transition-colors text-left"
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                      currency === c.code
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-stone-300"
                    )}
                  >
                    {currency === c.code && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      currency === c.code ? "text-[#1C1917]" : "text-stone-600"
                    )}
                  >
                    {c.label} - {c.symbol}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-stone-200">
      {/* Row 1 — main bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#6B5240] flex items-center justify-center">
            <PawPrint className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-lg tracking-tight">
            <span className="text-[#6B5240]">MyPet</span>
            <span className="text-stone-400 font-light">.ge</span>
          </span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {/* Add listing */}
          <Link
            href="/buy-sell"
            className="hidden sm:flex items-center gap-1.5 border border-[#6B5240] text-[#6B5240] hover:bg-[#6B5240] hover:text-white transition-all rounded-lg px-4 py-2 text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            დამატება
          </Link>

          {/* Language / Currency selector */}
          <LocaleSelector />

          {/* Favorites */}
          <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors text-stone-500">
            <Heart className="w-[18px] h-[18px]" />
          </button>

          {/* Auth */}
          {status === "loading" ? (
            <div className="w-8 h-8 rounded-full bg-stone-100 animate-pulse" />
          ) : session ? (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5F0E8] text-sm text-[#6B5240] font-medium">
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline max-w-[100px] truncate">
                  {session.user?.name}
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-9 h-9 flex items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 transition-colors"
                title="გასვლა"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-[#6B5240] transition-colors px-3 py-2"
            >
              <LogIn className="w-4 h-4" />
              <span>შესვლა</span>
            </Link>
          )}
        </div>
      </div>

      {/* Row 2 — sub-nav */}
      <div className="border-t border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <nav className="flex items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SUB_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors",
                  isActive(item.href)
                    ? "border-[#6B5240] text-[#6B5240]"
                    : "border-transparent text-stone-500 hover:text-[#6B5240] hover:border-stone-300"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <span className="hidden lg:flex items-center gap-1.5 text-xs text-stone-400 shrink-0 ml-4 pb-px">
            <Phone className="w-3 h-3" />
            032 2 80 00 15
          </span>
        </div>
      </div>
    </header>
  );
}
